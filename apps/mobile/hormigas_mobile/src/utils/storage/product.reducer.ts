import { ProductViewModel } from "@/interfaces/Product";
import { CreateProductDTO } from "@hormigas/application";

export type ProductAction =
    | { type: 'CREATE'; payload: CreateProductDTO }
    | { type: 'UPDATE'; payload: ProductViewModel }
    | { type: 'TOGGLE_ESTADO'; payload: bigint }



export function productReducer(state: ProductViewModel[], action: ProductAction): ProductViewModel[] {
    switch (action.type) {
        case 'CREATE':
            const newProduct: ProductViewModel = {
                ...action.payload,
                id: BigInt(Date.now()),
                stock: 0,
                acciones: ' ',
                estado: true
            }

            if (__DEV__) {
                console.log('[PRODUCT][CREATE]', {
                    input: action.payload,
                    output: newProduct
                })
            }

            return [...state, newProduct]
        case 'UPDATE': {
            if (__DEV__) {
                console.log('[PRODUCT][UPDATE]', {
                    id: action.payload.id,
                    changes: action.payload
                })
            }

            return state.map(p => 
                p.id === action.payload.id ? { ...p, ...action.payload } : p
            )
        }
        case 'TOGGLE_ESTADO': {
            const product = state.find(p => p.id === action.payload)

            if (__DEV__) {
                console.log('[PRODUCT][TOGGLE_ESTADO]', {
                    id: action.payload,
                    previousEstado: product?.estado,
                    nextEstado: product ? !product.estado : undefined
                });
            }

            return state.map(p =>
                p.id === action.payload ? { ...p, estado: !p.estado } : p
            )
        }
        default:
            return state
    }
}