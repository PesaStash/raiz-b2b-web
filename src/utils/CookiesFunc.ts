import Cookies from "js-cookie";

/**
 * The access token is held in an httpOnly cookie that scripts cannot read.
 * The browser only sees this hint cookie ("1" while signed in), set and
 * cleared by the server alongside the real session cookie.
 */
const SESSION_HINT_COOKIE = "raiz_auth";

export const hasSession = (): boolean => Cookies.get(SESSION_HINT_COOKIE) === "1";

export const clearSessionHint = () => {
  Cookies.remove(SESSION_HINT_COOKIE, { path: "/" });
};
