import jwtDecode from 'jwt-decode';

interface JwtPayload {
    roles: string[];
    sub: string;
}

export const saveToken = (token: string) => {
    localStorage.setItem('token', token);
};

export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

export const getUserRoles = (): string[] => {
    const token = getToken();
    if (token) {
        const decoded = jwtDecode<JwtPayload>(token);
        return decoded.roles;
    }
    return [];
};

export const getUsername = (): string | null => {
    const token = getToken();
    if (token) {
        const decoded = jwtDecode<JwtPayload>(token);
        return decoded.sub;
    }
    return null;
};