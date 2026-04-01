import { ProductViewModel } from "@/interfaces/Product";
import { useReducer } from "react";
import { productReducer } from "../storage/product.reducer";
import { CreateProductDTO } from "@hormigas/application";

const productos:ProductViewModel[] = [
  {
    id: 1n,
    nombre: 'Laptop Dell XPS 15',
    sku: 'LAP-XPS-15',
    categoria: 'Electronica',
    precio: 1299.99,
    stock: 15,
    estado: true,
    acciones: ' '
  },
  {
    id: 2n,
    nombre: 'Mouse Inalámbrico',
    sku: 'MOU-WRL-01',
    categoria: 'Electronica',
    precio: 1299.99,
    stock: 50,
    estado: true,
    acciones: ' '
  }
]

export function useProducts(inital: ProductViewModel[] = []) {
    const [products, dispatch] = useReducer(productReducer, productos)

    return {
        products,
        createProduct: (data: CreateProductDTO) => 
            dispatch({ type: 'CREATE', payload: data }),
        updateProduct: (product: ProductViewModel) =>
            dispatch({ type:'UPDATE', payload: product }),
        toggleStatus: (id: bigint) => 
            dispatch({ type: 'TOGGLE_ESTADO', payload: id })
    }
}