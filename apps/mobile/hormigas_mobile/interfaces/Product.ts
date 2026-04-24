import { ProductListItemDTO } from "@hormigas/application";

export interface ProductViewModel extends ProductListItemDTO {
    acciones: string
    categoriaId?: number
}