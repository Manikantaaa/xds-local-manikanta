import { formatDate } from "@/services/common-methods";
import { faqQuestions } from "@/types/event.types";

const EventsDisplay = (props: {companyId: number, eventList: faqQuestions[]}) => {

    return (
        <div className="py-12">
            {props.eventList && props.eventList.map((items: faqQuestions) =>(
                <div className="space-y-4 mb-4">
                <article
                className="border border-gray-200 rounded-[6px] relative">
                <div className="flex items-start gap-4 p-4">
                    <img
                    src={items.signedUrl}
                    alt=""
                    className="size-20 rounded-lg object-cover w-32"
                    />
                    <div className="bg-white">
                    <time className="block text-xs text-gray-500"> {formatDate(new Date(items.eventStartDate))} - {formatDate(new Date(items.eventEndDate))}</time>
                    <div>
                        <h3 className="mt-0.5 text-lg font-medium text-gray-900"> {items.eventName} </h3>
                        <p className="text-sm py-1">{items.eventDescription}</p>
                        <div className="flex items-center lg:space-x-4 py-2 address_break lg:space-x-0 space-x-2">
                        <span className="text-sm ">
                            <svg className="w-[20px] h-[20px] text-gray-700 mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path fill-rule="evenodd" d="M11.906 1.994a8.002 8.002 0 0 1 8.09 8.421 7.996 7.996 0 0 1-1.297 3.957.996.996 0 0 1-.133.204l-.108.129c-.178.243-.37.477-.573.699l-5.112 6.224a1 1 0 0 1-1.545 0L5.982 15.26l-.002-.002a18.146 18.146 0 0 1-.309-.38l-.133-.163a.999.999 0 0 1-.13-.202 7.995 7.995 0 0 1 6.498-12.518ZM15 9.997a3 3 0 1 1-5.999 0 3 3 0 0 1 5.999 0Z" clip-rule="evenodd" />
                            </svg>
                            {items.eventLocation}</span>
                        <a  href={items.eventUrl ? (items.eventUrl.startsWith('http://') || items.eventUrl.startsWith('https://') ? items.eventUrl : `https://${items.eventUrl}`) : '#'} target="_blank" className="break-all link_color text-sm"> 
                            {items.eventUrl}
                            <svg className="w-5 h-5 link_color ml-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961" />
                            </svg>
                            </a>
                            
                            { items.EventAttendees[0].meetToMatchLink != null && items.EventAttendees[0].meetToMatchLink != "" &&
                            <a  href={items.EventAttendees[0].meetToMatchLink} target="_blank" className="link_color flex items-center  text-sm"> 
                             {/* <svg
                              className="pr-0.5"
                              version="1.1"
                              width="26"
                              height="26"
                              viewBox="0 0 1024 1024" // Correct scaling for the paths
                              xmlns="http://www.w3.org/2000/svg"
                              aria-hidden="true"
                            >
                              <path
                                d="M 923.521,439.064 c 32.438,-1.416 59.886,23.732 61.302,56.17 1.409,32.433 -23.739,59.874 -56.18,61.29 -32.426,1.417 -59.875,-23.728 -61.291,-56.161 -1.412,-32.441 23.736,-59.879 56.169,-61.299 z M 76.4791,560.936 c 32.4339,-1.42 57.5779,-28.861 56.1619,-61.298 -1.412,-32.434 -28.861,-57.582 -61.2948,-56.162 -32.4373,1.412 -57.5816,28.85 -56.1692,61.287 1.4198,32.441 28.8572,57.585 61.3021,56.173 z M 237.982,677.306 C 97.7737,541.688 146.263,245.553 331.604,367.052 290.26,356.673 259.679,386.711 239.862,457.17 225.701,525.025 244.505,590.537 296.278,653.715 359.953,730.26 446.676,759 556.456,739.949 442.341,789.763 336.179,768.882 237.982,677.306 Z M 762.014,322.694 c -98.196,-91.579 -204.351,-112.46 -318.477,-62.646 109.787,-19.055 196.511,9.692 260.186,86.234 51.765,63.181 70.58,128.697 56.416,196.548 -19.822,70.46 -50.399,100.498 -91.743,90.118 185.342,121.5 233.831,-174.635 93.618,-310.254 z"
                                fill="#3eaae1"
                              />
                              <path
                                d="M 132.732,373.123 C 242.72,240.553 401.145,304.436 608.013,564.778 436.266,214.083 277.842,150.196 132.732,373.123 Z M 691.49,896.232 c 32.441,-1.42 57.582,-28.857 56.169,-61.298 -1.419,-32.434 -28.861,-57.578 -61.298,-56.166 -32.433,1.416 -57.585,28.861 -56.165,61.295 1.416,32.441 28.853,57.581 61.294,56.169 z M 867.265,626.877 C 722.158,849.804 563.723,785.913 391.988,435.219 598.855,695.56 757.276,759.451 867.265,626.877 Z M 308.514,103.768 c 32.437,-1.416 59.878,23.729 61.291,56.166 1.42,32.437 -23.732,59.875 -56.17,61.294 -32.437,1.417 -59.874,-23.728 -61.294,-56.161 -1.409,-32.438 23.724,-59.882 56.173,-61.299 z"
                                fill="#808181"
                              />
                            </svg>
                            MeetToMatch  */}
                             <img
                              src={`/MeetToMatch_Logo_horizontal_RGB.png`}
                              alt=""
                              className="size-20 w-24"
                              />
                            <svg className="w-5 h-5 link_color ml-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961" />
                            </svg>
                           </a>
                            // :
                            // <span className="pl-2">-</span>
                         }
                        </div>
                    </div>
                    </div>
                </div>
                </article>
                </div>
            ))}
        {/* <div className="space-y-4 mb-10 pt-12">
          <article
            className="border border-gray-200 rounded-[6px] relative">
            <div className="flex items-start gap-4 p-4">
              <img
                src="/xdsevent.png"
                alt=""
                className="size-20 rounded-lg object-cover w-32"
              />
              <div className="bg-white">
                <time className="block text-xs text-gray-500"> 10th Oct 2022 - 12th Dec 2022</time>
                <div className="w-[550px]">
                  <a href="#">
                    <h3 className="mt-0.5 text-lg font-medium text-gray-900"> XDS 2024 </h3>
                  </a>
                  <p className="text-sm py-1">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae dolores, possimus pariatur animi temporibus nesciunt praesentium dolore sed nulla..</p>
                  <div className="space-x-4 py-2">
                    <span className="text-sm ">
                      <svg className="w-[20px] h-[20px] text-gray-700 mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M11.906 1.994a8.002 8.002 0 0 1 8.09 8.421 7.996 7.996 0 0 1-1.297 3.957.996.996 0 0 1-.133.204l-.108.129c-.178.243-.37.477-.573.699l-5.112 6.224a1 1 0 0 1-1.545 0L5.982 15.26l-.002-.002a18.146 18.146 0 0 1-.309-.38l-.133-.163a.999.999 0 0 1-.13-.202 7.995 7.995 0 0 1 6.498-12.518ZM15 9.997a3 3 0 1 1-5.999 0 3 3 0 0 1 5.999 0Z" clip-rule="evenodd" />
                      </svg>
                      Hyderabad</span>
                    <a href="#" className="link_color text-sm"> <svg className="w-5 h-5 link_color mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961" />
                    </svg>
                      https://www.google.com/</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="iam_interst absolute right-5">
              <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2">Add to My Events</button>
            </div>
          </article>
          <article
            className="border border-gray-200 rounded-[6px] relative">
            <div className="flex items-start gap-4 p-4">
              <img
                src="/xdsevent2.png"
                alt=""
                className="size-20 rounded-lg object-cover w-32"
              />
              <div className="bg-white">
                <time className="block text-xs text-gray-500"> 10th Oct 2022 - 12th Dec 2022</time>
                <div className="w-[550px]">
                  <a href="#">
                    <h3 className="mt-0.5 text-lg font-medium text-gray-900"> Gamescom </h3>
                  </a>
                  <p className="text-sm py-1">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae dolores, possimus pariatur animi temporibus nesciunt praesentium dolore sed nulla..</p>
                  <div className="space-x-4 py-2">
                    <span className="text-sm ">
                      <svg className="w-[20px] h-[20px] text-gray-700 mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M11.906 1.994a8.002 8.002 0 0 1 8.09 8.421 7.996 7.996 0 0 1-1.297 3.957.996.996 0 0 1-.133.204l-.108.129c-.178.243-.37.477-.573.699l-5.112 6.224a1 1 0 0 1-1.545 0L5.982 15.26l-.002-.002a18.146 18.146 0 0 1-.309-.38l-.133-.163a.999.999 0 0 1-.13-.202 7.995 7.995 0 0 1 6.498-12.518ZM15 9.997a3 3 0 1 1-5.999 0 3 3 0 0 1 5.999 0Z" clip-rule="evenodd" />
                      </svg>
                      Hyderabad</span>
                    <a href="#" className="link_color text-sm"> <svg className="w-5 h-5 link_color mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961" />
                    </svg>
                      https://www.google.com/</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="iam_interst absolute right-5">
                <button type="button" className="text-white bg-green-600 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2">Added <svg className="w-5 h-5 ml-2 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 21a9 9 0 1 1 0-18c1.052 0 2.062.18 3 .512M7 9.577l3.923 3.923 8.5-8.5M17 14v6m-3-3h6" />
                </svg>
                </button>
              </div>
          </article>
          <article
            className="border border-gray-200 rounded-[6px] relative">
            <div className="flex items-start gap-4 p-4">
              <img
                src="/xdsevent3.png"
                alt=""
                className="size-20 rounded-lg object-cover w-32"
              />
              <div className="bg-white">
                <time className="block text-xs text-gray-500"> 10th Oct 2022 - 12th Dec 2022</time>
                <div className="w-[550px]">
                  <a href="#">
                    <h3 className="mt-0.5 text-lg font-medium text-gray-900"> World Gaming Summit </h3>
                  </a>
                  <p className="text-sm py-1">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Recusandae dolores, possimus pariatur animi temporibus nesciunt praesentium dolore sed nulla..</p>
                  <div className="space-x-4 py-2">
                    <span className="text-sm ">
                      <svg className="w-[20px] h-[20px] text-gray-700 mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                        <path fill-rule="evenodd" d="M11.906 1.994a8.002 8.002 0 0 1 8.09 8.421 7.996 7.996 0 0 1-1.297 3.957.996.996 0 0 1-.133.204l-.108.129c-.178.243-.37.477-.573.699l-5.112 6.224a1 1 0 0 1-1.545 0L5.982 15.26l-.002-.002a18.146 18.146 0 0 1-.309-.38l-.133-.163a.999.999 0 0 1-.13-.202 7.995 7.995 0 0 1 6.498-12.518ZM15 9.997a3 3 0 1 1-5.999 0 3 3 0 0 1 5.999 0Z" clip-rule="evenodd" />
                      </svg>
                      Hyderabad</span>
                    <a href="#" className="link_color text-sm"> <svg className="w-5 h-5 link_color mr-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961" />
                    </svg>
                      https://www.google.com/</a>
                  </div>
                </div>
              </div>
            </div>

            <div className="iam_interst absolute right-5">
              <button type="button" className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2">Add to My Events</button>
            </div>
          </article>
        </div> */}
        </div>
    )
}

export default EventsDisplay;