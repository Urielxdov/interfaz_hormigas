import { GenericForm } from '@/src/utils/components/Form/GenericForm'
import { FormFieldConfig } from '@/src/utils/components/Form'
import { CreateUsuarioDTO } from '@hormigas/application'
import { passwordStrong } from '@hormigas/mobile-shared'
import { z } from 'zod'

const usuarioFormSchema = z.object({
  nombre: z.string()
    .min(1, 'El nombre es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(80, 'Máximo 80 caracteres')
    .transform(v => v.trim()),
  correo: z.string()
    .min(1, 'El correo es obligatorio')
    .max(120, 'Máximo 120 caracteres')
    .email('Formato de correo inválido')
    .transform(v => v.toLowerCase().trim()),
  password: passwordStrong,
  sucursalId: z.string()
    .regex(/^\d*$/, 'Solo números')
    .optional(),
})

type UserFormValues = z.input<typeof usuarioFormSchema>

const USER_FORM_FIELDS: FormFieldConfig<UserFormValues>[] = [
  {
    name: 'nombre',
    label: 'Nombre',
    placeholder: 'Ej. Juan García',
  },
  {
    name: 'correo',
    label: 'Correo electrónico',
    placeholder: 'Ej. juan@empresa.com',
    autoCapitalize: 'none',
    keyboardType: 'email-address',
  },
  {
    name: 'password',
    label: 'Contraseña',
    secureTextEntry: true,
  },
  {
    name: 'sucursalId',
    label: 'ID Sucursal (opcional)',
    placeholder: 'Ej. 1',
    keyboardType: 'numeric',
  },
]

interface CreateUserScreenProps {
  defaultValues?: Partial<UserFormValues>
  onSubmit?: (data: CreateUsuarioDTO) => void
}

export function CreateUserScreen ({ defaultValues, onSubmit }: CreateUserScreenProps) {
  const handleSubmit = (values: z.output<typeof usuarioFormSchema>) => {
    onSubmit?.({
      nombre: values.nombre,
      correo: values.correo,
      password: values.password,
      sucursalId: values.sucursalId && values.sucursalId.length > 0
        ? Number(values.sucursalId)
        : null,
    })
  }

  return (
    <GenericForm<UserFormValues>
      title='Nuevo Usuario'
      subtitle='Completa los datos del nuevo usuario'
      fields={USER_FORM_FIELDS}
      schema={usuarioFormSchema as any}
      defaultValues={{ nombre: '', correo: '', password: '', sucursalId: '', ...defaultValues }}
      onSubmit={handleSubmit as any}
    />
  )
}

export default CreateUserScreen
