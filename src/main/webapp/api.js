export const url =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8789/api/v1/"
    : "/api/v1/";
export const token =
  process.env.NODE_ENV === "development"
    ? "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJndWVzdEBsYW1pc3BsdXMub3JnIiwiYXV0aCI6IlN1cGVyIEFkbWluIiwibmFtZSI6Ikd1ZXN0IEd1ZXN0IiwiZXhwIjoxNzA5NjYxNzk2fQ.JeQEwraEOueO8OOReHsOGj--Ug4goAreVDutjiaGgOxKpPlOtNTj1_0SEm9u6f4gY9vqRlajqSgEqrmeAbipQw"
    : new URLSearchParams(window.location.search).get("jwt");
