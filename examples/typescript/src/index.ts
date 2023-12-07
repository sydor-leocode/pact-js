import axios, { AxiosPromise } from 'axios';

export class DogService {
  private url: string;
  private port: number;

  constructor(endpoint: any) {
    this.url = endpoint.url;
    this.port = endpoint.port;
  }

  public getMeDogs = async (): Promise<any> => {
    const res = await fetch(`${this.url}:${this.port}/dogs`, {
      headers: { Accept: 'application/json' },
      method: 'GET',
    });

    return res.json();
  };
}
