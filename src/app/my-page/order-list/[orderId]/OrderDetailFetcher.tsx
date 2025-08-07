'use client';

import { Order } from '@/types';
import { useEffect, useState } from 'react';
import { getOrder } from '@/data/functions/order';
import ProductItem from '@/app/my-page/order-list/[orderId]/ProductItem';
import LinkButton from '@/components/common/LinkButton';
import useUserStore from '@/stores/useUserStore';

interface OrderDetailFetcherProps {
  orderId: number;
}

export default function OrderDetailFetcher({ orderId }: OrderDetailFetcherProps) {
  const [order, setOrder] = useState<Order>();
  const { user } = useUserStore();
  const [discount, setDiscount] = useState<number>(0);

  useEffect(() => {
    const userLocalStorage = localStorage.getItem('user');
    let accessToken = '';

    if (userLocalStorage) {
      try {
        const parsed = JSON.parse(userLocalStorage);
        accessToken = parsed?.state?.user?.token?.accessToken;
      } catch (err) {}
    }

    async function fetchOrder(orderId: number) {
      if (!accessToken) return;

      try {
        const res = await getOrder(accessToken, orderId);

        if (res.ok && res.item) {
          setOrder(res.item);
        }
      } catch (err) {}
    }

    fetchOrder(orderId);
  }, []);

  // 총 할인 금액 계산
  useEffect(() => {
    let totalDiscount = 0;
    order?.products.map((item) => {
      if (item.extra.isSale) {
        totalDiscount += (item.extra.salePrice ?? 0) * item.quantity || 0;
      }
    });
    setDiscount(totalDiscount);
  }, [order]);

  const totalPrice =
    order?.products?.reduce((sum, item) => {
      return sum + item.price;
    }, 0) ?? 0;

  const totalSalePrice =
    order?.products?.reduce((sum, item) => {
      const sale = item.extra.salePrice ?? item.price; // 할인 가격이 없으면 원가 사용
      return sum + sale * item.quantity;
    }, 0) ?? 0;

  const totalDiscount = totalPrice - totalSalePrice;
  const shippingFee = totalPrice - totalDiscount > 50000 ? 0 : 3000;

  return (
    <div className="flex flex-col gap-4 mb-20">
      <section>
        <p className="mb-4">배송지</p>
        <div className="flex flex-col gap-1 p-5 rounded-lg border-[.0625rem] border-gray-150 text-sm">
          {/* user_id로 user 정보 받아오기 */}
          <p>
            <span className="mr-1">{user?.name}</span>
            <span>{user?.address}</span>
          </p>
          <p className="mb-4">{order?.address.value}</p>
          <p>배송 메모</p>
          <div className="rounded-lg border-[.0625rem] border-gray-150 p-2 text-gray-350">
            <p>{order?.extra.shippingMemo}</p>
          </div>
        </div>
      </section>
      <section>
        <p className="mb-4">
          주문 상품 <span>{order?.products.length}</span>종
        </p>
        <div className="flex flex-col gap-4 p-5 rounded-lg border-[.0625rem] border-gray-150 text-sm">
          {order?.products.map((item) => (
            <div key={item._id}>
              <ProductItem item={item} />
            </div>
          ))}
        </div>
      </section>
      <section>
        <div className="flex flex-col gap-4 py-4 border-b-[.0625rem] border-gray-150">
          <div className="flex justify-between">
            <span>총 상품 금액</span>
            <span>{totalPrice.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between">
            <span>총 배송비</span>
            <span>{shippingFee.toLocaleString()}원</span>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span>총 할인 금액</span>
              <span>{totalDiscount.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-gray-350 text-sm">
              <span>- 기간할인</span>
              <span>{totalDiscount.toLocaleString()}원</span>
            </div>
          </div>
        </div>
      </section>
      <div className="flex justify-between mb-5">
        <span>결제 금액</span>
        <span>{(totalPrice - totalDiscount + shippingFee).toLocaleString()}원</span>
      </div>
      <LinkButton href="/my-page/order-list" size="lg">
        뒤로 가기
      </LinkButton>
    </div>
  );
}
