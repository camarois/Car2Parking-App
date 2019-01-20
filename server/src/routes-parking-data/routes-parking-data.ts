import { injectable, inject } from 'inversify';
import { WebService } from '../WebService';
import { Router, Request, Response } from 'express';
import {MongoDB} from '../BD/MongoDB';
import Types from '../Types';
import { SocketServerService } from '../socket-io.service';
import { Document } from 'mongoose';

const OK_STATUS: number = 200;

@injectable()
export class RoutesParkingData extends WebService {

    public readonly mainRoute: string;

    public constructor(@inject(Types.SocketServerService) private socket: SocketServerService,
                       private mongoDB: MongoDB = new MongoDB()) {
        super();
        this.mainRoute = '';
    }

    public get routes(): Router {
        const router: Router = Router();

        router.get('/getParkingData', (req: Request, res: Response) => {
            this.mongoDB.model.find({ Occupation: 0 }, (err: Error, data: Document) => {
                res.status(OK_STATUS).json(data);
            });
        });

        router.post('/reservation/:id/:time', (req: Request, res: Response) => {
            this.mongoDB.model.findOneAndUpdate({ sNoPlace: req.params.id }, {$set: { Occupation: 1 }}).then((parkingSpot: Document) => {
                res.status(OK_STATUS).json(parkingSpot);
                setTimeout(() => {
                    this.mongoDB.model.findOneAndUpdate({ sNoPlace: req.params.id }, {$set: { Occupation: 0 }})
                    .then((parking: Document) => {
                        this.socket.reservationOver(parking);
                    });
                },         req.params.time*6000);
            });
        });

        return router;
    }

}
