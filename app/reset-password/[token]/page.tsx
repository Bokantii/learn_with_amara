import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "../../../components/ui/card";
import { PublicShell } from "../../../components/PublicShell";
import logo from "./../../../assets/logo.png";
import ResetForm from "./ResetForm";

export default async function ResetPasswordConfirm({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <PublicShell>
      <div className="min-h-[80vh] flex items-center justify-center py-12 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-md mx-auto">
            <Card className="border-2">
              <CardHeader className="p-8 space-y-2 text-center">
                <div className="flex justify-center mb-4">
                  <Image src={logo} className="w-18 h-18 object-contain" alt="ICLP Logo" />
                </div>
                <h2 className="text-3xl">Choose a new password</h2>
                <p className="text-muted-foreground">
                  Pick a password of at least 8 characters.
                </p>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-6">
                <ResetForm token={token} />
                <div className="text-center text-sm">
                  <Link className="text-primary hover:underline" href="/reset-password">
                    Request a new link
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
