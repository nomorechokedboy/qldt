package transferrequests

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"encore.app/internal/apperr"
	"encore.app/internal/docxtemplate"
	"encore.app/internal/entities"
)

const handoverTemplateFile = "transfer-handover-templ.docx"

// conditionLabels mirrors handover-export.ts's CONDITION_LABELS.
var conditionLabels = map[entities.MaterialCondition]string{
	entities.MaterialConditionGood:             "",
	entities.MaterialConditionFair:             "Tình trạng: khá",
	entities.MaterialConditionNeedsMaintenance: "Cần bảo dưỡng",
	entities.MaterialConditionDamaged:          "Hư hỏng",
}

type handoverPerson struct {
	name     string
	rank     string
	position string
}

func personFromUser(u *entities.User) handoverPerson {
	if u == nil {
		return handoverPerson{}
	}
	p := handoverPerson{name: u.DisplayName}
	if u.Rank != nil {
		p.rank = *u.Rank
	}
	if u.Position != nil {
		p.position = *u.Position
	}
	return p
}

func unitFullName(u *entities.Unit, parent *entities.Unit) string {
	if u == nil {
		return ""
	}
	if parent != nil {
		return u.Name + "/" + parent.Name
	}
	return u.Name
}

// buildItems mirrors handover-export.ts's buildItems: only 'approved' items
// are handed over, assets are grouped by material type with their serials
// joined, and stocks are grouped by material type + condition with a summed
// quantity.
func (s *service) buildItems(detail *Detail) []map[string]string {
	type assetGroup struct {
		name    string
		serials []string
	}
	assetGroupsByType := make(map[int64]*assetGroup)
	var assetTypeOrder []int64

	for _, item := range detail.MaterialAssetItems {
		if item.ItemStatus != entities.TransferRequestItemStatusApproved {
			continue
		}
		asset := item.MaterialAsset
		if asset == nil {
			continue
		}
		typeID := asset.MaterialTypeID
		group, ok := assetGroupsByType[typeID]
		if !ok {
			name := fmt.Sprintf("#%d", typeID)
			if mt, err := s.materialTypeRepo.Find(context.Background(), []int64{typeID}, ""); err == nil {
				if t := firstOrNil(mt); t != nil {
					name = t.Name
				}
			}
			group = &assetGroup{name: name}
			assetGroupsByType[typeID] = group
			assetTypeOrder = append(assetTypeOrder, typeID)
		}
		group.serials = append(group.serials, asset.SerialNumber)
	}

	var items []map[string]string
	for _, typeID := range assetTypeOrder {
		group := assetGroupsByType[typeID]
		items = append(items, map[string]string{
			"stt":      strconv.Itoa(len(items) + 1),
			"name":     group.name,
			"quantity": fmt.Sprintf("%d khẩu", len(group.serials)),
			"serials":  joinComma(group.serials),
			"note":     "",
		})
	}

	type stockGroup struct {
		name      string
		condition entities.MaterialCondition
		quantity  int64
		unit      string
	}
	stockGroupsByKey := make(map[string]*stockGroup)
	var stockKeyOrder []string

	for _, item := range detail.MaterialStockItems {
		if item.ItemStatus != entities.TransferRequestItemStatusApproved {
			continue
		}
		key := fmt.Sprintf("%d:%s", item.MaterialTypeID, item.Condition)
		group, ok := stockGroupsByKey[key]
		if !ok {
			name := "Vật tư"
			unit := ""
			if item.MaterialType != nil {
				name = item.MaterialType.Name
				if item.MaterialType.UnitOfMeasure != nil {
					unit = *item.MaterialType.UnitOfMeasure
				}
			}
			group = &stockGroup{name: name, condition: item.Condition, unit: unit}
			stockGroupsByKey[key] = group
			stockKeyOrder = append(stockKeyOrder, key)
		}
		group.quantity += item.Quantity
	}

	for _, key := range stockKeyOrder {
		group := stockGroupsByKey[key]
		quantity := strconv.FormatInt(group.quantity, 10)
		if group.unit != "" {
			quantity += " " + group.unit
		}
		note := conditionLabels[group.condition]
		if _, known := conditionLabels[group.condition]; !known {
			note = string(group.condition)
		}
		items = append(items, map[string]string{
			"stt":      strconv.Itoa(len(items) + 1),
			"name":     group.name,
			"quantity": quantity,
			"serials":  "",
			"note":     note,
		})
	}

	return items
}

func joinComma(parts []string) string {
	out := ""
	for i, p := range parts {
		if i > 0 {
			out += ", "
		}
		out += p
	}
	return out
}

func itemsSummary(items []map[string]string) string {
	out := ""
	for i, item := range items {
		if i > 0 {
			out += ", "
		}
		out += item["quantity"] + " " + item["name"]
	}
	return out
}

// BuildHandoverReport mirrors handover-export.ts's buildHandoverReport: it
// loads an approved transfer request's full detail, groups its approved
// material items into a handover line-item list, and fills those into the
// transfer-handover-templ.docx template.
func (s *service) BuildHandoverReport(ctx context.Context, id int64, city string) ([]byte, error) {
	tr, err := s.getRequestOrThrow(ctx, id)
	if err != nil {
		return nil, err
	}
	if tr.Status != entities.TransferRequestStatusApproved {
		return nil, apperr.InvalidArgument("A handover report can only be exported for an approved transfer request")
	}

	detail, err := s.LoadDetail(ctx, tr)
	if err != nil {
		return nil, err
	}

	items := s.buildItems(detail)
	if len(items) == 0 {
		return nil, apperr.InvalidArgument("This transfer request has no approved material items to hand over")
	}

	var sourceParent, destParent *entities.Unit
	if detail.SourceUnit != nil && detail.SourceUnit.ParentID != nil {
		if rows, err := s.unitRepo.Find(ctx, []int64{*detail.SourceUnit.ParentID}, ""); err == nil {
			sourceParent = firstOrNil(rows)
		}
	}
	if detail.DestinationUnit != nil && detail.DestinationUnit.ParentID != nil {
		if rows, err := s.unitRepo.Find(ctx, []int64{*detail.DestinationUnit.ParentID}, ""); err == nil {
			destParent = firstOrNil(rows)
		}
	}

	var commander *entities.User
	if detail.DestinationUnit != nil && detail.DestinationUnit.CommanderID != nil {
		if rows, err := s.userRepo.Find(ctx, []int64{*detail.DestinationUnit.CommanderID}); err == nil {
			commander = firstOrNil(rows)
		}
	}

	decidedAtStr := tr.UpdatedAt
	if tr.DecidedAt != nil {
		decidedAtStr = *tr.DecidedAt
	}
	decidedAt, err := time.Parse(time.RFC3339, decidedAtStr)
	if err != nil {
		decidedAt = time.Now().UTC()
	}

	giao := personFromUser(detail.RequestedBy)
	nhan := personFromUser(commander)

	sourceUnitName := ""
	if detail.SourceUnit != nil {
		sourceUnitName = detail.SourceUnit.Name
	}
	destinationUnitName := ""
	if detail.DestinationUnit != nil {
		destinationUnitName = detail.DestinationUnit.Name
	}
	parentUnitName := sourceUnitName
	if sourceParent != nil {
		parentUnitName = sourceParent.Name
	}

	fields := map[string]string{
		"parentUnitName":          parentUnitName,
		"sourceUnitName":          sourceUnitName,
		"destinationUnitName":     destinationUnitName,
		"sourceUnitFullName":      unitFullName(detail.SourceUnit, sourceParent),
		"destinationUnitFullName": unitFullName(detail.DestinationUnit, destParent),
		"itemsSummary":            itemsSummary(items),
		"city":                    city,
		"day":                     decidedAt.Format("02"),
		"month":                   decidedAt.Format("01"),
		"year":                    decidedAt.Format("2006"),
		"hour":                    decidedAt.Format("15"),
		"minute":                  decidedAt.Format("04"),
		"location":                fmt.Sprintf("Phòng giao ban %s/%s", sourceUnitName, parentUnitName),
		"giaoName":                giao.name,
		"giaoRank":                giao.rank,
		"giaoPosition":            giao.position,
		"nhanName":                nhan.name,
		"nhanRank":                nhan.rank,
		"nhanPosition":            nhan.position,
	}

	template, err := os.ReadFile(filepath.Join("templates", handoverTemplateFile))
	if err != nil {
		return nil, fmt.Errorf("read handover template: %w", err)
	}

	return docxtemplate.Fill(template, fields, items)
}
