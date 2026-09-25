import { adminApi } from "@/api/AdminApi";
import { normalizeApiError } from "@/api/apiError";
import type { UserResponse } from "../interfaces/user.response";

export const loginAction = async (correo: string, contrasenia: string): Promise<UserResponse> => {
    try {
        const { data } = await adminApi.post<UserResponse>("/auth/login", { correo, contrasenia });
        return data;
    } catch (error) {
        throw normalizeApiError(error);
    }
};

export const refreshTokenAction = async (refreshToken: string): Promise<UserResponse> => {
    try {
        const { data } = await adminApi.post<UserResponse>("/auth/refresh", { refreshToken });
        return data;
    } catch (error) {
        throw normalizeApiError(error);
    }
};

export const logoutAction = async (refreshToken: string): Promise<void> => {
    try {
        await adminApi.post("/auth/logout", { refreshToken });
    } catch (error) {
        throw normalizeApiError(error);
    }
};
