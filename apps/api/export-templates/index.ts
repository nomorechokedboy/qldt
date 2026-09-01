import {
	ExportTemplate,
	ExportTemplateDB,
	ExportTemplateParams,
	ExportTemplateQuery
} from '../schema/export-templates'

export interface ExportTemplateRepository {
	create(params: ExportTemplateParams): Promise<ExportTemplateDB>
	delete(id: number): Promise<ExportTemplateDB | undefined>
	find(query: ExportTemplateQuery): Promise<ExportTemplate[]>
	getOne(id: number): Promise<ExportTemplate | undefined>
}
