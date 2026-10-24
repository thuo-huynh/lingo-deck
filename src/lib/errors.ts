export class AppError extends Error {
  constructor(
    public status: 400 | 401 | 403 | 404 | 409 | 429,
    message: string
  ) {
    super(message);
  }
}

export const notFound = (what = "Không tìm thấy") => new AppError(404, what);
export const badRequest = (msg: string) => new AppError(400, msg);
export const conflict = (msg: string) => new AppError(409, msg);

export function parseId(id: string) {
  // Avoid importing ObjectId here so client bundles never pull in the driver.
  if (!/^[a-f0-9]{24}$/i.test(id)) throw notFound();
  return id;
}
