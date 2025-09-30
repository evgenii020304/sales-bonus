/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
   // @TODO: Расчет выручки от операции
    const { discount, sale_price, quantity } = purchase;

    const discountMultiplier = 1 - (discount / 100);
    const revenue = sale_price * quantity * discountMultiplier;

    return Math.round(revenue * 100) / 100;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */

function calculateBonusByProfit(index, total, seller) {
    // @TODO: Расчет бонуса от позиции в рейтинге
    const { profit } = seller;

    const position = index + 1;

    let bonusPercentage;
    if (position === 1) {
        bonusPercentage = 15;
    } else if (position === 2 || position === 3) {
        bonusPercentage = 10;
    } else if (position === total) {
        bonusPercentage = 0;
    } else {
        bonusPercentage = 5;
    }

    return profit * (bonusPercentage / 100);
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue: *, top_products: *, bonus: *, name: *, sales_count: *, profit: *, seller_id: *}[]}
 */
function analyzeSalesData(data, options) {
    const { calculateRevenue, calculateBonus } = options;

    // @TODO: Проверка входных данных
    if (!data || typeof data !== 'object') {
        throw new Error('Данные не переданы');
    }

    if (!Array.isArray(data.sellers) || data.sellers.length === 0) {
        throw new Error('Массив продавцов пуст');
    }

    if (!Array.isArray(data.products) || data.products.length === 0) {
        throw new Error('Массив товаров пуст');
    }

    if (!Array.isArray(data.purchase_records) || data.purchase_records.length === 0) {
        throw new Error('Массив записей о продажах пуст');
    }

    // @TODO: Проверка наличия опций
    if (!calculateBonus || typeof calculateBonus !== 'function') {
        throw new Error ('Функция calculateBonus не передана')
    }

    if (!calculateRevenue || typeof calculateRevenue !== 'function') {
        throw new Error ('Функция calculateRevenue не передана')
    }

    // @TODO: Подготовка промежуточных данных для сбора статистики
    const sellerStats = data.sellers.map(seller => ({
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name}`,
        revenue: 0,
        profit: 0,
        sales_count: 0,
        products_sold: {},
        bonus_amount: 0,
        top_products: []
    }));

    // @TODO: Индексация продавцов и товаров для быстрого доступа
    const sellerIndex = Object.fromEntries(sellerStats.map(seller => [seller.id, seller]));
    const productIndex = Object.fromEntries(data.products.map(product => [product.sku, product]));

    // @TODO: Расчет выручки и прибыли для каждого продавца
    data.purchase_records.forEach((record) => {
        const seller = sellerIndex[record.seller_id];
        if (!seller) return;

        seller.sales_count += 1;
        seller.revenue += record.total_amount;

        record.items.forEach(item => {
            const product = productIndex[item.sku];
            if (!product) return;

            const cost = product.purchase_price * item.quantity;
            const revenue = calculateRevenue(item, product);
            const profit = revenue - cost;
            seller.profit += profit;

            if (!seller.products_sold[item.sku]) {
                seller.products_sold[item.sku] = 0;
            }
            seller.products_sold[item.sku] += item.quantity;
        });
    });

    // @TODO: Сортировка продавцов по прибыли
    const sortedSellers = sellerStats.sort((a, b) => b.profit - a.profit);

    // @TODO: Назначение премий на основе ранжирования
    sortedSellers.forEach((seller, index) => {
        const bonusAmount = calculateBonus(index, sortedSellers.length, seller);
        seller.bonus_amount = parseFloat(bonusAmount.toFixed(2));

        seller.top_products = Object.entries(seller.products_sold)
            .map(([sku, quantity]) => ({
                sku: sku,
                quantity: quantity
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 10);
    });

    // @TODO: Подготовка итоговой коллекции с нужными полями
    return sellerStats.map(seller => ({
        seller_id: seller.id,
        name: seller.name,
        revenue: +seller.revenue.toFixed(2),
        profit: +seller.profit.toFixed(2),
        sales_count: seller.sales_count,
        top_products: seller.top_products,
        bonus: +seller.bonus_amount.toFixed(2)
    }))
}
