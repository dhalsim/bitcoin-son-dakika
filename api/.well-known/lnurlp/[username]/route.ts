import { SuccessResponse } from "../../../../api-helpers/utils";

export async function GET(
  request: Request,
  { params }: { params: { username: string } },
) {
  const { username } = params;

  return SuccessResponse({
    username,
    message: "LNURLp endpoint works!",
  });
}
