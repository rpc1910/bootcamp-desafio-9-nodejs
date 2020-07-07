import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';
import AppError from '@shared/errors/AppError';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({ name, price, quantity });
    await this.ormRepository.save(product);
    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });
    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const ids = products.map(product => product.id);
    const result = await this.ormRepository.find({ id: In(ids) });
    return result;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsData = await this.findAllById(products);
    const updateProducts = productsData.map(item => {
      const productFind = products.find(p => p.id === item.id);

      if (!productFind) {
        throw new AppError('Produto não encontrado');
      }

      if (item.quantity < productFind?.quantity) {
        throw new AppError('Quantidade insuficiente');
      }

      const newProduct = {
        ...item,
        quantity: item.quantity - productFind.quantity,
      };

      return newProduct;
    });

    await this.ormRepository.save(updateProducts);
    return updateProducts;
  }
}

export default ProductsRepository;
