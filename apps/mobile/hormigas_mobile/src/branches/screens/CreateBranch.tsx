import { GenericForm } from '@/src/utils/components/Form/GenericForm'
import { FormFieldConfig } from '@/src/utils/components/Form'
import SelectField from '@/src/utils/components/SelectField'
import { Controller } from 'react-hook-form'
import { useUsuarios } from '@/src/users/hooks/useUsuarios'
import { sucursalSchema, SucursalInput } from '@hormigas/mobile-shared'

const BRANCH_FORM_FIELDS: FormFieldConfig<SucursalInput>[] = [
  { name: 'nombre', label: 'Nombre', placeholder: 'Ej. Sucursal Centro' },
  { name: 'direccion', label: 'Dirección', placeholder: 'Ej. Av. Principal 123' },
  { name: 'codigo', label: 'Código', placeholder: 'Ej. CENTRO-01', autoCapitalize: 'characters' },
  { name: 'telefono', label: 'Teléfono', placeholder: 'Ej. 5551234567', keyboardType: 'numeric' },
  { name: 'ciudad', label: 'Ciudad', placeholder: 'Ej. Monterrey' },
]

interface CreateBranchScreenProps {
  defaultValues?: Partial<SucursalInput>
  onSubmit?: (data: SucursalInput) => void
}

export function CreateBranchScreen ({ defaultValues, onSubmit }: CreateBranchScreenProps) {
  const { usuarios } = useUsuarios()
  const userOptions = usuarios.map(u => ({ label: u.name, value: u.id }))

  return (
    <GenericForm<SucursalInput>
      title='Nueva Sucursal'
      subtitle='Completa el formulario para crear una nueva sucursal'
      fields={BRANCH_FORM_FIELDS}
      schema={sucursalSchema as any}
      defaultValues={{ nombre: '', direccion: '', encargadoId: null, codigo: '', telefono: '', ciudad: '', ...defaultValues }}
      onSubmit={data => onSubmit?.(data)}
    >
      {(control, errors) => (
        <Controller
          control={control}
          name='encargadoId'
          render={({ field: { value, onChange } }) => (
            <SelectField
              label='Responsable'
              placeholder='Seleccionar responsable...'
              options={userOptions}
              value={value ?? undefined}
              onChange={v => onChange(v)}
              error={(errors.encargadoId as { message?: string } | undefined)?.message}
            />
          )}
        />
      )}
    </GenericForm>
  )
}

export default CreateBranchScreen
