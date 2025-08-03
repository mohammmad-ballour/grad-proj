import { environment } from "../../../environments/environment";

export abstract class BaseService {
  protected readonly baseUrl = environment.apiBaseUrl;
}
