import { Request, Response } from 'express';
import Knex from '../database/connection';

class PointsController {
  async index(request: Request, response: Response) {
    const { city, uf, items } = request.query;

    // Colocar todos os items em um array. Separa em cada vírgula
    // e retira os espaços antes ou depois de cada item
    const parsedItems = String(items)
      .split(',')
      .map(item => Number(item.trim()));

    const points = await Knex('points')
      .join('point_items', 'points.id', '=', 'point_items.point_id')
      .whereIn('point_items.item_id', parsedItems)
      .where('city', String(city))
      .where('uf', String(uf))
      .distinct()
      .select('points.*');

    return response.json(points);
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await Knex('points').where('id', id).first();

    if (!point) {
      return response.status(400).json({ message: 'Point not found.' });
    }

    // Listar items que está nesse ponto de coleta específico nesse método show
    const items = await Knex('items')
      .join('point_items', 'items.id', '=', 'point_items.item_id')
      .where('point_items.point_id', id)
      .select('items.title');

    return response.json({ point, items });
  }

  async create(request: Request, response: Response) {
    const { 
      name,
      email, 
      whatsapp, 
      latitude, 
      longitude, 
      city, 
      uf, 
      items // Esse é o id de cada item(lâmpada, pilha, óleo...)
    } = request.body;
  
    const trx = await Knex.transaction();

    const point = { 
      image: 'https://images.unsplash.com/photo-1565061828011-282424b9ab40?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=350&q=60', 
      name, 
      email, 
      whatsapp, 
      latitude, 
      longitude, 
      city, 
      uf 
    };
  
    const insertedIds = await trx('points').insert(point);
  
    const point_id = insertedIds[0];
  
  
    const pointItems = items.map((item_id: number) => {
      return {
        item_id,
        point_id,
      };
    })
  
    await trx('point_items').insert(pointItems);

    await trx.commit();
  
    return response.json({ 
      id: point_id,
      ...point,
     });
  
  }
}

export default PointsController;