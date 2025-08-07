import "/public/css/detatable.css";
import LegalSecurity from "./legal-security";
import RateServices from "./rate-services";
import ProjectPerformanceReviews from "./projectperformancereviews";
import BuyersNotesForSPs from "./buyers-notes-for-sp";
import usePagePermissions from "@/hooks/usePagePermissions";

const MySparkMain = (props: { companyId: number, setrating: (setrating: number) => void, setLastUpdatedDate: (setLastUpdatedDate: string) => void, isCompanyUser: boolean }) => {
  const legalSecurity_access = usePagePermissions(12)
  const rateServices_access = usePagePermissions(13)
  const projectPerformanceReviews_access = usePagePermissions(14)
  const notes_access = usePagePermissions(18)
  return (
    <>
      {(!props.isCompanyUser || (props.isCompanyUser && legalSecurity_access.canRead)) && <div className="pb-6 pt-0"><LegalSecurity companyId={props.companyId} setLastUpdatedDate={(val: string) => props.setLastUpdatedDate(val)} userPermissions={legalSecurity_access}></LegalSecurity></div>}
      {(!props.isCompanyUser || (props.isCompanyUser && rateServices_access.canRead)) && <div className="pb-0"><RateServices companyId={props.companyId} setLastUpdatedDate={(val: string) => props.setLastUpdatedDate(val)} userPermissions={rateServices_access}></RateServices></div>}
      {(!props.isCompanyUser || (props.isCompanyUser && projectPerformanceReviews_access.canRead)) && <div className="pb-6"><ProjectPerformanceReviews companyId={props.companyId} setrating={(val: number) => props.setrating(val)} setLastUpdatedDate={(val: string) => props.setLastUpdatedDate(val)} userPermissions={projectPerformanceReviews_access}></ProjectPerformanceReviews></div>}

      {(!props.isCompanyUser ||(props.isCompanyUser && notes_access.canRead) ) && <div className="contactus pb-12">
        <BuyersNotesForSPs companyId={props.companyId} setLastUpdatedDate={(val: string) => props.setLastUpdatedDate(val)}  userPermissions={notes_access}></BuyersNotesForSPs>
      </div>
      }
    </>
  );
}

export default MySparkMain;
