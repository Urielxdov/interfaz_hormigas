import { FormFieldConfig } from '@/src/utils/components/Form'
import GenericCreateScreen from '@/src/utils/components/GenericCreateScreen'

type BranchFormValues = {
  nombre: string
  direccion: string
  responsable: string
  codigo: string
  telefono: string
  ciudad: string
}

const BRANCH_FORM_FIELDS: FormFieldConfig<BranchFormValues>[] = [
  {
    name: 'nombre',
    label: 'Nombre',
    placeholder: 'Ej. Sucursal Centro',
    rules: { required: 'El nombre es obligatorio' }
  },
  {
    name: 'direccion',
    label: 'Direccion',
    placeholder: 'Ej. Av. Principal 123',
    rules: { required: 'La direccion es obligatoria' }
  },
  {
    name: 'responsable',
    label: 'Responsable',
    placeholder: 'Ej. Maria Garcia',
    rules: { required: 'El responsable es obligatorio' }
  },
  {
    name: 'codigo',
    label: 'Codigo',
    placeholder: 'Ej. CENTRO-01'
  },
  {
    name: 'telefono',
    label: 'Telefono',
    placeholder: 'Ej. 555 123 4567'
  },
  {
    name: 'ciudad',
    label: 'Ciudad',
    placeholder: 'Ej. Monterrey'
  }
]

interface CreateBranchScreenProps {
  defaultValues?: Partial<BranchFormValues>
  onSubmit?: (data: BranchFormValues) => void
}

export function CreateBranchScreen({ defaultValues, onSubmit: onSubmitProp }: CreateBranchScreenProps) {
  return (
    <GenericCreateScreen
      title='Nueva Sucursal'
      subtitle='Completa el formulario para crear una nueva sucursal'
      fields={BRANCH_FORM_FIELDS}
      defaultValues={{ nombre: '', direccion: '', responsable: '', codigo: '', telefono: '', ciudad: '', ...defaultValues }}
      onSubmit={data => onSubmitProp?.(data)}
    />
  )
}

export default CreateBranchScreen
