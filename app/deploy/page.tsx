import type { Metadata } from "next";
import { DeployUploader } from "../deploy-uploader";

export const metadata: Metadata = {
  title: "Deploy with Passport | Passport Admin",
};

export default function DeployPage() {
  return <DeployUploader />;
}
