import { GenericForm } from '@/src/utils/components/Form/GenericForm'
import { FormFieldConfig } from '@/src/utils/components/Form'

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
    label: 'Dirección',
    placeholder: 'Ej. Av. Principal 123',
    rules: { required: 'La dirección es obligatoria' }
  },
  {
    name: 'responsable',
    label: 'Responsable',
    placeholder: 'Ej. Maria García',
    rules: { required: 'El responsable es obligatorio' }
  },
  {
    name: 'codigo',
    label: 'Código',
    placeholder: 'Ej. CENTRO-01'
  },
  {
    name: 'telefono',
    label: 'Teléfono',
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

export function CreateBranchScreen ({ defaultValues, onSubmit }: CreateBranchScreenProps) {
  return (
    <GenericForm<BranchFormValues>
      title='Nueva Sucursal'
      subtitle='Completa el formulario para crear una nueva sucursal'
      fields={BRANCH_FORM_FIELDS}
      defaultValues={{ nombre: '', direccion: '', responsable: '', codigo: '', telefono: '', ciudad: '', ...defaultValues }}
      onSubmit={data => onSubmit?.(data)}
    />
  )
}

export default CreateBranchScreen
