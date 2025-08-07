import { authFetcher, authPostdata, fetcher } from "@/hooks/fetcher";
import { Button, Modal, Label, Select, TextInput, Textarea } from "flowbite-react";
import { useForm } from "react-hook-form";
import Multiselect from "multiselect-react-dropdown";
import { useEffect, useState } from "react";
import { ENDPOINTS, getEndpointUrl } from "@/constants/endpoints";
import { sanitizeData } from "@/services/sanitizedata";
import { decodeMailcheckResponse } from "@/services/common-methods";

interface createCompanyType {
  firstName: string,
  lastName: string,
  email: string,
  companyName: string,
  companyWebUrl: string,
  linkedInUrl: string,
  role: string,
  companyDescription: string,
  companySize: string,
  services: string[],
}


const CreateCompanyPopup = (props: {openAddCompanyModel: boolean, setOpenAddCompanyModel: (value: boolean) => void; setreloadPage: (value: boolean) => void}) => {
    const [services, setService] = useState<{ id: number, serviceName: string }[]>([]);
    const [companySizes, setCompanySizes] = useState<{ id: number, size: string }[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [theSelectedServices, setTheSelectedServices] = useState<{ id: number, serviceName: string }[]>([]);
    const [firstName, setFirstName] = useState<string>('');
    const [lasttName, setLastName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [linkedin, setLinkedin] = useState<string>('');
    const [companyName, setCompanyName] = useState<string>('');
    const [companyWebsite, setCompanyWebsite] = useState<string>('');
    const [companyDescription, setCompanyDescription] = useState<string>('');
    const [roleType, setRoleType] = useState<string>('');
    const [selectedCmpanySizes, setSelectedCmpanySizes] = useState<string>('');
    const [successmessage, setSuccessmessage] = useState<string>('');
    const [reloadPage, setReloadPage] = useState<boolean>(false);
    const [errormessage, setErrormessage] = useState<string>('');



    useEffect(() => {
        const getAllServices = async () => {
          const services = await authFetcher(`${getEndpointUrl(ENDPOINTS.getserviceslist)}`).catch((error) => {
            console.log(error);
          });
          if (services) {
            console.log(services);
            if (services.list) {
              setService(services.list);
            }
          }
        }
        const getCompanySizes = async () => {
          const companySizes = await authFetcher(`${getEndpointUrl(ENDPOINTS.getcompanysizeslist)}`).catch((error) => {
            console.log(error);
          });
          if(companySizes) {
            console.log(companySizes);
            if (companySizes.list) {
              setCompanySizes(companySizes.list);
            }
            else {
              console.log(
                `Api Responded with statuscode ${companySizes.statuscode}`,
              );
            }
          }
        }
        getAllServices();
        getCompanySizes();
        
      },[props.openAddCompanyModel]);

      const [mailError, setMailError] = useState<string>("");
  const checkMail = (async (e: any) => {
    setMailError('');
    const email = e.target.value.toLowerCase();
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    const mailFormatCheck = pattern.test(email);
    if (mailFormatCheck) {
        setEmail(email);
      const data = await fetcher(getEndpointUrl(ENDPOINTS.checkExistedMails(email)));
      const isMailExisted =  decodeMailcheckResponse(data);
      if (isMailExisted) {
        setMailError("The email address cannot be used at this time. Please check the address and try again.");
        setEmail("");
      }else {
        setMailError('');
      }
      console.log(data);
    }
  });

  function onAddOrRemoveService(theSelectedService: { id: number; serviceName: string }[]) {
    // console.log(theSelectedService[0].serviceName);
    const theServices: string[] = [];
    if(theSelectedService.length < 4 ) {
      for (const item of theSelectedService) {
        theServices.push(item.serviceName);
        setErrormessage('');
      }
    } else {
      setErrormessage('Select max 3 services only.');
    }
    setSelectedServices(theServices);
  }

  useEffect(() => {
    setErrormessage('');
    if(!props.openAddCompanyModel) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setCompanyName('');
      setCompanyWebsite('');
      setLinkedin('');
      setRoleType('');
      setCompanyDescription('');
      setSelectedCmpanySizes('');
      setSelectedServices([]);
    }
    if(roleType == 'buyer') {
      setLinkedin('NA');
      setCompanyWebsite('NA')
      setCompanyDescription('NA');
      setSelectedCmpanySizes('NA');
      setSelectedServices(['NA']);
    }
  }, [firstName, lasttName, email, companyName, companyWebsite, linkedin, roleType, companyDescription, selectedCmpanySizes, !props.openAddCompanyModel])

  const onSubmit = (async () => {

    if (firstName != '' && lasttName != '' && email != '' && companyName != '' && companyWebsite != '' && linkedin != '' && roleType != '' && companyDescription != '' && selectedCmpanySizes != '') {
      const postData :createCompanyType = {
        firstName: firstName,
        lastName: lasttName,
        email: email,
        companyName: companyName,
        companyWebUrl: companyWebsite,
        linkedInUrl: linkedin,
        role: roleType,
        companyDescription: companyDescription,
        companySize: selectedCmpanySizes,
        services: selectedServices,
      }
    
      const createNewCompany = sanitizeData(postData);
        await authPostdata<createCompanyType>(`${getEndpointUrl(ENDPOINTS.createSingleCompany)}`, postData)
        .then((result) => {
           if(result.status && result.status == 'success'){
            setTimeout(() => {
              props.setOpenAddCompanyModel(false);
              setSuccessmessage('');
            }, 2000);
            props.setreloadPage(true);
            setSuccessmessage('Successfully created.'); 
           }
           else {
            setErrormessage('Somthing went wrong, Try again.');
           }
        })
        .catch((err) => {
          setErrormessage(err);
          console.log(err);
        });

    } else{
      setErrormessage('Fill all the required fields.')
    }

  });

  return (
    <>
       <Modal show={props.openAddCompanyModel} onClose={() => props.setOpenAddCompanyModel(false)} size="lg" className="text_box_readuce">
            <Modal.Header className="modal_header">Create New Company</Modal.Header>
            <Modal.Body>
            <form
            className="w-full space-y-6 my-5"
            >
            <div>
              <div className="mb-2 block">
                  <Label htmlFor="role" className="font-bold text-xs" >Industry Type
                  <span style={{ color: 'red' }}> *</span></Label>
                  </div>
                  <div className="flex items-center space-x-2 pb-2">
                  <input
                      type="radio"
                      value="buyer"
                      name="roleType"
                      id="buyer"
                      onChange={() => setRoleType('buyer')}
                      className="aspect-square h-4 w-4 rounded-full border border-gray-300"
                  />
                  <Label htmlFor="buyer" className="text-sm font-normal">
                      Buyer
                  </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                  <input
                      type="radio"
                      onChange={() => setRoleType('Service Provider')}
                      value="service_provider"
                      name="roleType"
                      id="service_provider"
                      className="aspect-square h-4 w-4 rounded-full border border-gray-300"
                  />
                  <Label htmlFor="service_provider" className="text-sm font-normal">
                      Service Provider
                  </Label>
                  </div>
              </div>
            <div>
                <div className="mb-2 inline-flex items-center">
                <Label htmlFor="firstName" className="font-bold text-xs">First Name
                <span style={{ color: 'red' }}> *</span></Label>
                </div>
                <TextInput
                type="text"
                id="firstName"
                onChange={(e) => setFirstName(e.target.value)} 
                required 
                shadow sizing="sm"
                />
            </div>

            <div>
                <div className="mb-2 inline-flex items-center">
                <Label htmlFor="lastName" className="font-bold text-xs">Last Name
                <span style={{ color: 'red' }}> *</span></Label>
                </div>
                <TextInput
                type="text"
                id="lastName"
                onChange={(e) => setLastName(e.target.value)} 
                required 
                shadow sizing="sm"
                />
            </div>

            <div>
                <div className="mb-2 inline-flex items-center">
                <Label htmlFor="companyEmail" className="font-bold text-xs">Email Address
                <span style={{ color: 'red' }}> *</span></Label>
                </div>
                <TextInput
                type="email"
                id="email"
                onKeyUp={checkMail}
                />
                {mailError && mailError != '' && 
                <p className="font-medium text-red-500 text-xs mt-1">
                {mailError as string}
                </p> 
                }
            </div>

            <div>
                <div className="mb-2 inline-flex items-center">
                <Label htmlFor="linkedInUrl" className="font-bold text-xs">Linkedin Profile
                <span style={{ color: 'red' }}> *</span></Label>
                </div>
                <TextInput
                type="text"
                id="linkedInUrl"
                value={roleType && roleType == 'buyer' ? 'NA': linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                required
                shadow sizing="sm"
                placeholder="https://www.linkedin.com/in/yourprofilename/"
                />
            </div>

            <div>
            <div className="mb-2 inline-flex items-center">
                <Label htmlFor="companyName" className="font-bold text-xs">Company Name
                <span style={{ color: 'red' }}> *</span></Label>
                </div>
                <TextInput
                type="text"
                id="companyName"
                onChange={(e) => setCompanyName(e.target.value)} 
                required 
                shadow sizing="sm"
                />
            </div>

            <div>
                <div className="mb-2 inline-flex items-center">
                <Label htmlFor="website" className="font-bold text-xs" >Company Website
                <span style={{ color: 'red' }}> *</span></Label>
                </div>
                <TextInput
                type="text"
                id="companyWebUrl"
                value={roleType == 'buyer' ? 'NA': companyWebsite }
                onChange={(e) => setCompanyWebsite(e.target.value)} 
                required 
                shadow sizing="sm"
                />
            </div>
            <div>
                <div className="mb-2 block">
                <Label htmlFor="description" className="font-bold text-xs" >Company Description
                <span style={{ color: 'red' }}> *</span></Label>
                </div>
                <Textarea id="description" name="DescriptionNote" value={roleType == 'buyer' ? 'NA': companyDescription } placeholder="" rows={4} onChange={(e) => setCompanyDescription(e.target.value)} 
                required 
                shadow
                />
            </div>

            <div>
                <Label htmlFor={"shortDescription"} className="font-bold text-xs mb-2 inline-flex items-center">Company Size <span style={{ color: 'red' }}> *</span></Label>
                <Select
                    id="companySizes"
                    onChange={(e) => setSelectedCmpanySizes(e.target.value)}
                >
                    {roleType == 'buyer' ? <option value={roleType == 'buyer' ? 'NA': '' } >NA</option>: 
                    <>
                      <option value= "">Select</option>
                      {companySizes.map((size: { id: number; size: string }, index) => (
                      <option key={index} value={size.size} >
                          {size.size}
                      </option>
                      ))}
                    </>    
                    }
                    
                </Select>
                </div>

            <div>
            <div className="mb-2 inline-flex items-center">
                <Label htmlFor="services" className="font-bold text-xs">Services</Label>
                    </div>
                    {roleType == 'buyer' ? <Select onChange ={ () =>setSelectedServices(['NA'])}><option value={roleType == 'buyer' ? 'NA': '' } >NA</option></Select>: 
                    <>
                      <Multiselect
                        emptyRecordMsg="-"
                        options={services}
                        displayValue="serviceName"
                        onSelect={(e) => onAddOrRemoveService(e)}
                        onRemove={(e) => onAddOrRemoveService(e)}
                    />
                    </>    
                    }
                    
                </div>
            </form>
            </Modal.Body>
            <Modal.Footer className="modal_footer">
              { successmessage && 
              <div className="text-sm text-green-500 mr-6">{successmessage}</div>
              }
              { errormessage &&
                <div className="text-sm text-red-500 mr-6">{errormessage}</div>
              }
            <Button color="gray" onClick={() => props.setOpenAddCompanyModel(false)}> Cancel</Button>
            <Button type="submit" onClick={() => onSubmit() } disabled = {successmessage != '' ? true : false }>Create</Button>
            </Modal.Footer>
        </Modal>
    </>
  )

}

export default CreateCompanyPopup;