import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'E-Comm Backend API',
      version: '1.0.0',
      description: 'E-commerce backend API: users, products, orders and Stripe checkout/webhook.',
    },
    servers: [
      { url: `http://localhost:${process.env.PORT}`, description: 'Local development server' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            email: { type: 'string' },
            isAdmin: { type: 'boolean' },
            wishlist: {
              type: 'array',
              items: { type: 'string', description: 'Product ObjectId' },
            },
          },
        },
        Product: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            name: { type: 'string' },
            image: { type: 'string' },
            brand: { type: 'string' },
            category: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            countInStock: { type: 'number' },
            rating: { type: 'number' },
            numReviews: { type: 'number' },
          },
        },
        Review: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            rating: { type: 'number' },
            comment: { type: 'string' },
            user: { type: 'string' },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            qty: { type: 'integer' },
            image: { type: 'string' },
            price: { type: 'number' },
            product: { type: 'string' },
          },
        },
        ShippingAddress: {
          type: 'object',
          properties: {
            address: { type: 'string' },
            city: { type: 'string' },
            postalCode: { type: 'string' },
            country: { type: 'string' },
          },
        },
        PaymentResult: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            status: { type: 'string' },
            update_time: { type: 'string' },
            email_address: { type: 'string' },
          },
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            orderItems: { type: 'array', items: { $ref: '#/components/schemas/OrderItem' } },
            shippingAddress: { $ref: '#/components/schemas/ShippingAddress' },
            paymentResult: { $ref: '#/components/schemas/PaymentResult' },
            stripeSessionId: { type: 'string' },
            stripePaymentIntentId: { type: 'string' },
            itemPrice: { type: 'number' },
            taxPrice: { type: 'number' },
            shippingPrice: { type: 'number' },
            totalPrice: { type: 'number' },
            isDelivered: { type: 'boolean' },
            deliveredAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            stack: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
