import { Injectable } from '@nestjs/common';
import { CreateEventDto, createSponseredDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsRepository } from './events.repository';
import { CompaniesService } from 'src/companies/companies.service';
@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepo: EventsRepository,
    private readonly companiesService: CompaniesService
  ) { }

  create(createEventDto: CreateEventDto) {
    return this.eventsRepo.create(createEventDto)
  }

  findAll() {
    return this.eventsRepo.findAllActiveEvents()
  }

  findOne(id: number) {
    return this.eventsRepo.getEventById(id);
  }

  update(id: number, updateEventDto: CreateEventDto) {
    return this.eventsRepo.updateEvent(id, updateEventDto);
  }

  updatingMeetLink(id: number, updateEventDto: {meetLink: string}) {
    return this.eventsRepo.updatingMeetLink(id, updateEventDto);
  }

  remove(id: number) {
    return `This action removes a #${id} event`;
  }

  async updateDisplayOrder(postData: { qsnData: { id: number, orderId: number } }[]) {
    return this.eventsRepo.updateEventsOrder(postData);
  }
  async updateEventDisplayStatus(id: number) {
    return this.eventsRepo.updateEventsDisplay(id);
  }
  async deleteEventById(id: number) {
    return this.eventsRepo.deleteEventWithId(id);
  }
  async getAllEvents(companyId: number, loggedCompanyId: number) {
    return this.eventsRepo.getAllEvents(companyId, loggedCompanyId);
  }
  async addAttandee(eventId: number, companyId: number) {
    await this.companiesService.callCheckNotificationAndSend(companyId, "Events");
    return this.eventsRepo.addAttandee(eventId, companyId);
  }
  async romevAttandee(eventId: number, companyId: number) {
    return this.eventsRepo.romevAttandee(eventId, companyId);
  }
/************************************************************************** */
  createSponserServicee(createServiceData:createSponseredDto){
    return this.eventsRepo.saveSponseredService(createServiceData);
  }
  findAllSponseredService(){
    return this.eventsRepo.findAllSponseredService();
  }

  getSPserviceById(spServiceId: number){
    return this.eventsRepo.getSpserviceById(spServiceId);
  }
  updateSpservices(spServiceId: number, createSponseredDto: createSponseredDto){
    return this.eventsRepo.updateSpservice(spServiceId, createSponseredDto);
  }
  /**************************************************************************** */
}
