import { setUUIDGenerator } from '@hormigas/application'
import * as Crypto from 'expo-crypto'

// UUIDs criptograficos para toda la app (clientId de las ventas, local_id de productos,
// ids de la cola de sync); Hermes no trae crypto.randomUUID. Se importa al inicio de
// app/_layout.tsx, antes de crear cualquier servicio.
setUUIDGenerator(() => Crypto.randomUUID())
