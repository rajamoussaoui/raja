export interface User {
    id: string
    email: string
    name: string
    password: string
    role: "user" | "admin"
    image: string | null
  }
  
  