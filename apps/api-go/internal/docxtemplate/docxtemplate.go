// Package docxtemplate fills a narrow subset of the docx-templates (npm)
// command syntax directly against a .docx's raw word/document.xml, mirroring
// what apps/api/transfer-requests/handover-export.ts gets from the
// docx-templates library. There's no Go equivalent dependency in this
// repo and the templating need is small and fixed to one template, so this
// hand-rolls it: simple `{field}` substitution plus one `{FOR item IN
// items}...{END-FOR item}` table-row repeat block, both of which the
// transfer-handover-templ.docx template uses.
package docxtemplate

import (
	"archive/zip"
	"bytes"
	"fmt"
	"io"
	"strings"
)

const documentXMLPath = "word/document.xml"

var xmlEscaper = strings.NewReplacer(
	"&", "&amp;",
	"<", "&lt;",
	">", "&gt;",
	`"`, "&quot;",
)

func escape(s string) string {
	return xmlEscaper.Replace(s)
}

// Fill loads the .docx at templateBytes, replaces every `{key}` occurrence
// in word/document.xml with fields[key] (XML-escaped), and expands the
// `{FOR item IN items}...{END-FOR item}` table-row block once per entry in
// items, substituting `{$item.key}` placeholders within the repeated row
// from that entry's fields. It returns the resulting .docx as bytes.
func Fill(templateBytes []byte, fields map[string]string, items []map[string]string) ([]byte, error) {
	zr, err := zip.NewReader(bytes.NewReader(templateBytes), int64(len(templateBytes)))
	if err != nil {
		return nil, fmt.Errorf("docxtemplate: open template zip: %w", err)
	}

	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)

	for _, f := range zr.File {
		rc, err := f.Open()
		if err != nil {
			return nil, fmt.Errorf("docxtemplate: open %s: %w", f.Name, err)
		}

		content, err := io.ReadAll(rc)
		rc.Close()
		if err != nil {
			return nil, fmt.Errorf("docxtemplate: read %s: %w", f.Name, err)
		}

		if f.Name == documentXMLPath {
			xml, err := expandItemsLoop(string(content), items)
			if err != nil {
				return nil, err
			}
			content = []byte(substituteFields(xml, fields))
		}

		w, err := zw.Create(f.Name)
		if err != nil {
			return nil, fmt.Errorf("docxtemplate: create %s: %w", f.Name, err)
		}
		if _, err := w.Write(content); err != nil {
			return nil, fmt.Errorf("docxtemplate: write %s: %w", f.Name, err)
		}
	}

	if err := zw.Close(); err != nil {
		return nil, fmt.Errorf("docxtemplate: close zip: %w", err)
	}

	return buf.Bytes(), nil
}

func substituteFields(xml string, fields map[string]string) string {
	for key, value := range fields {
		xml = strings.ReplaceAll(xml, "{"+key+"}", escape(value))
	}
	return xml
}

const (
	forMarker    = "{FOR item IN items}"
	endForMarker = "{END-FOR item}"
)

// expandItemsLoop finds the single <w:tr>...</w:tr> table row containing
// forMarker and the one containing endForMarker, treats the row(s) between
// them as the per-item template, and replaces the whole
// FOR-row..END-FOR-row span with one filled copy of the template row per
// entry in items.
func expandItemsLoop(xml string, items []map[string]string) (string, error) {
	forIdx := strings.Index(xml, forMarker)
	if forIdx < 0 {
		return xml, nil
	}
	endForIdx := strings.Index(xml, endForMarker)
	if endForIdx < 0 {
		return "", fmt.Errorf("docxtemplate: found %q without matching %q", forMarker, endForMarker)
	}

	forRowStart, forRowEnd, err := enclosingRow(xml, forIdx)
	if err != nil {
		return "", fmt.Errorf("docxtemplate: %s marker: %w", forMarker, err)
	}
	endForRowStart, endForRowEnd, err := enclosingRow(xml, endForIdx)
	if err != nil {
		return "", fmt.Errorf("docxtemplate: %s marker: %w", endForMarker, err)
	}

	rowTemplate := xml[forRowEnd:endForRowStart]

	var rows strings.Builder
	for _, item := range items {
		row := rowTemplate
		for key, value := range item {
			row = strings.ReplaceAll(row, "{$item."+key+"}", escape(value))
		}
		rows.WriteString(row)
	}

	return xml[:forRowStart] + rows.String() + xml[endForRowEnd:], nil
}

// enclosingRow returns the [start, end) byte range of the <w:tr>...</w:tr>
// element that contains byte offset idx.
func enclosingRow(xml string, idx int) (start, end int, err error) {
	start = strings.LastIndex(xml[:idx], "<w:tr")
	if start < 0 {
		return 0, 0, fmt.Errorf("no enclosing <w:tr> found")
	}
	closeTag := "</w:tr>"
	rel := strings.Index(xml[idx:], closeTag)
	if rel < 0 {
		return 0, 0, fmt.Errorf("no closing </w:tr> found")
	}
	end = idx + rel + len(closeTag)
	return start, end, nil
}
