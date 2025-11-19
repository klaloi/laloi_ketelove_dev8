// types/index.ts

export type UserData = {
  uid?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  initials?: string;
  password?: string;
  createdAt?: string;
  imageUrl?: string;
};

export type ProductData = {
  id?: string;
  title: string;
  description: string;
  price: number | string;
  imageUrl?: string;
  category?: string;
  location?: string;
  postedBy?: string;
  contact?: string;
  createdAt?: string;
  userId?: string;
  key?: string; 
};

//Version unique et cohérente
export type RootStackParamList = {
  Welcome: undefined;
  Connection: undefined;
  Login: undefined;

  Home: { userData?: UserData };

  AddProduct:
    | {
        userId?: string;
        productToEdit?: ProductData;
      }
    | undefined;

  Categories:
    | {
        selectedCategory?: string;
        currentUserId?: string;
      }
    | undefined;

  MonCompte: {
    userData?: UserData;
  };

  MesProduits:
    | {
        userId?: string;
      }
    | undefined;

  ProductDetail: {
    product: ProductData;
    userId: string;
    currentUserId: string | null;
  };
};
