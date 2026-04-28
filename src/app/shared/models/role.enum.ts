/**
 * Espelha o enum `Role` do backend.
 * Use sempre este enum — nunca strings literais — para comparar ou passar roles.
 *
 * @example
 *   <button *hasRole="Role.ADMIN">Apenas Admin</button>
 *   <div *hasRole="[Role.ADMIN, Role.EMPLOYEE]">Ambos</div>
 *   if (user.role === Role.ADMIN) { ... }
 */
export enum Role {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}
