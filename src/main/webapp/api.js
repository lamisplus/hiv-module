
export const url =
  process.env.NODE_ENV === "development"
    ? "http://localhost:8789/api/v1/"
    : "/api/v1/";
export const token =
  process.env.NODE_ENV === "development"
? "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJndWVzdEBsYW1pc3BsdXMub3JnIiwiYXV0aCI6IlN1cGVyIEFkbWluIiwibmFtZSI6Ikd1ZXN0IEd1ZXN0IiwiZXhwIjoxNzE2OTkyODI2fQ.OOGiVBKFV7Jjqgo5hevjsevhpdXxXAQltS2ByD0DvZGVzDwz6raIk_IZm0I4UtR1JZp9wRD_KVLZqugMf5_SEQ"   : new URLSearchParams(window.location.search).get("jwt");

