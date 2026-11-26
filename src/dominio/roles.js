/**
 * Espejo de RolesDelSistema del backend.
 *
 * El backend es la autoridad sobre los permisos: cada endpoint vuelve a
 * verificarlos. Acá sólo se usan para decidir qué mostrar y qué esconder, así
 * el usuario no ve botones que van a terminar en un 403.
 */
export const ROLES = {
  duenio: "Dueño",
  administrador: "Administrador",
  recepcionista: "Recepcionista",
  entrenador: "Entrenador",
  nutricionista: "Nutricionista",
  socio: "Socio",
};

/** Nivel de cada rol: a mayor número, más permisos. */
const JERARQUIA = {
  [ROLES.duenio]: 5,
  [ROLES.administrador]: 4,
  [ROLES.recepcionista]: 3,
  [ROLES.entrenador]: 2,
  [ROLES.nutricionista]: 2,
  [ROLES.socio]: 1,
};

export function nivelDeRol(rol) {
  return JERARQUIA[rol] ?? 0;
}

/** Todo lo que no es únicamente socio forma parte del personal. */
export function esRolDePersonal(rol) {
  return nivelDeRol(rol) >= JERARQUIA[ROLES.nutricionista];
}
