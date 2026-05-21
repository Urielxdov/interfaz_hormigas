import { fieldRules } from '@/src/utils/validation'
import { GenericForm } from '@/src/utils/components/Form/GenericForm'
import { FormFieldConfig } from '@/src/utils/components/Form'
import { CreateUsuarioDTO } from '@hormigas/application'

type UserFormValues = {
  nombre: string
  correo: string
  password: string
  sucursalId: string
}

const USER_FORM_FIELDS: FormFieldConfig<UserFormValues>[] = [
  {
    name: 'nombre',
    label: 'Nombre',
    placeholder: 'Ej. Juan García',
    rules: fieldRules.nombre
  },
  {
    name: 'correo',
    label: 'Correo electrónico',
    placeholder: 'Ej. juan@empresa.com',
    rules: fieldRules.email,
    autoCapitalize: 'none',
    keyboardType: 'email-address'
  },
  {
    name: 'password',
    label: 'Contraseña',
    rules: fieldRules.password,
    secureTextEntry: true
  },
  {
    name: 'sucursalId',
    label: 'ID Sucursal (opcional)',
    placeholder: 'Ej. 1',
    keyboardType: 'numeric',
    rules: {
      maxLength: { value: 10, message: 'Máximo 10 dígitos' },
      pattern: { value: /^[0-9]*$/, message: 'Solo números' }
    }
  }
]

interface CreateUserScreenProps {
  defaultValues?: Partial<UserFormValues>
  onSubmit?: (data: CreateUsuarioDTO) => void
}

export function CreateUserScreen ({ defaultValues, onSubmit }: CreateUserScreenProps) {
  const handleSubmit = (values: UserFormValues) => {
    onSubmit?.({
      nombre: values.nombre,
      correo: values.correo,
      password: values.password,
      sucursalId: values.sucursalId ? Number(values.sucursalId) : null
    })
  }

  return (
    <GenericForm<UserFormValues>
      title='Nuevo Usuario'
      subtitle='Completa los datos del nuevo usuario'
      fields={USER_FORM_FIELDS}
      defaultValues={{ nombre: '', correo: '', password: '', sucursalId: '', ...defaultValues }}
      onSubmit={handleSubmit}
    />
  )
}

export default CreateUserScreen
