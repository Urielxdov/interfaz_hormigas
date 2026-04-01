import { ProductViewModel } from "@/interfaces/Product";
import { CreateProductDTO } from "@hormigas/application";

export type ProductAction =
    | { type: 'CREATE'; payload: CreateProductDTO }
    | { type: 'UPDATE'; payload: ProductViewModel }
    | { type: 'TOGGLE_ESTADO'; payload: bigint }



export function productReducer(state: ProductViewModel[], action: ProductAction): ProductViewModel[] {
    switch (action.type) {
        case 'CREATE':
            return [...state, { 
                ...action.payload, 
                id: BigInt(Date.now()), 
                stock: 0, 
                acciones: ' ',
                estado: true
            }]
        case 'UPDATE':
            if (__DEV__){
                console.log("Actualizacion de producto")
            }
            return state.map(p => 
                p.id === action.payload.id ? { ...p, ...action.payload } : p
            )
        case 'TOGGLE_ESTADO':
            return state.map(p =>
                p.id === action.payload ? { ...p, estado: !p.estado } : p
            )
        default:
            return state
    }
}