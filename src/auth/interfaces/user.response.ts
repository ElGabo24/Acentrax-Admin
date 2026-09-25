export interface User {
    id: string;
    nombreCompleto: string;
    correo: string;
    fotoPerfil: string | null;
    /**
     * Lee `users.es_superadmin`, el mismo valor que el guard del backend.
     * Solo `true` da acceso: ausente (backend sin desplegar) cuenta como `false`.
     */
    esSuperadmin?: boolean;
}

export interface UserResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}
