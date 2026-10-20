import { redirect } from "next/navigation";

export default function AccueilAdmin() {
  redirect("/admin/commandes");
}
