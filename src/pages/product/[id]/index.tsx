import { stripe } from '@/lib/stripe';
import { ImageContainer, ProductContainer, ProductDetails } from '@/styles/pages/products';
import axios from 'axios';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useState } from 'react';
import { Stripe } from 'stripe';

interface ProductProps {
  product: {
    id: string;
    name: string;
    imageUrl: string;
    price: string;
    description: string;
    defaultPriceId: string;
  }
}

export default function Product({ product }: ProductProps) {
  const [isCreatingCheckoutSession, setIsCreatingCheckoutSession] = useState(false)	

    async function handleBuyProduct() {
      try {

        setIsCreatingCheckoutSession(true)

        const response = await axios.post('/api/checkout', {
          priceId: product.defaultPriceId
        })

        const { checkoutUrl } = response.data

        //direcionar para rota externa
        window.location.href = checkoutUrl
      } catch (err) {

        setIsCreatingCheckoutSession(false)

        // conectar com uma ferramenta de observabilidade (datadog / sentry)
          alert('Falha ao redirecionar ao checkout')
      }
    }
    
    return (
      <>
        <Head>
            <title>{ product.name } | Shop</title>
        </Head>
        <ProductContainer>
          <ImageContainer>
            <Image src={ product.imageUrl } width={520} height={480} alt=''/>
          </ImageContainer>
          <ProductDetails>
            <h1>{ product.name }</h1>
            <span>{ product.price }</span>

            <p>{ product.description }</p>

            <button onClick={handleBuyProduct} disabled={isCreatingCheckoutSession}>
              Comprar agora
            </button>
          </ProductDetails>
        </ProductContainer>
      </>
    );
  }

  export const getStaticPaths = async () => {
    return {
      // ou coloca nada ou colocar entre os 5 e 10 produtos mais acessados
      paths: [
        { params: { id: 'prod_RgPIQDfhQT67T3' } },
      ],
      fallback: true,
    }
  }
  
  export const getStaticProps: GetStaticProps<any, { id: string }> = async ({ params }) => {
    if (!params) {
      return {
        notFound: true,
      };
    }

    const productId = params.id;

    const product = await stripe.products.retrieve(productId, {
      expand: ['default_price'],
    });

    const price = product.default_price as Stripe.Price

    return {
      props: {
        product: {      
          id: product.id,
          name: product.name,
          imageUrl: product.images[0],
          price: new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format((price.unit_amount ?? 0) / 100),
          description: product.description,
          defaultPriceId: price.id,
        }
      },
      revalidate: 60 * 60 * 1, // 1 hour
    };
  }