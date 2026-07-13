import { getApplicationsAction } from "@/actions/admin/applications";
import { ApplicationList } from "@/components/features/admin/application-list";

export default async function AdminApplicationsPage() {
  const applications = await getApplicationsAction();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold">Заявки с сайта</h2>
        <p className="mt-1 text-slate-600">
          Заявки из форм на главной странице и в разделе «Контакты».
        </p>
      </div>
      <ApplicationList applications={applications} />
    </div>
  );
}
