// Mock authentication for development while migrating to Supabase
// This file provides a temporary authentication solution

export interface MockUser {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
}

class MockAuthService {
  private currentUser: MockUser | null = null;
  private listeners: ((user: MockUser | null) => void)[] = [];

  constructor() {
    // Check localStorage for saved session
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('mockUser');
      if (savedUser) {
        this.currentUser = JSON.parse(savedUser);
      }
    }
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<{ user: MockUser }> {
    // Mock authentication - accept any email/password for development
    const user: MockUser = {
      uid: `mock-${Date.now()}`,
      email,
      displayName: email.split('@')[0],
      emailVerified: true,
    };

    this.currentUser = user;
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('mockUser', JSON.stringify(user));
    }

    // Notify listeners
    this.notifyListeners(user);

    return { user };
  }

  async createUserWithEmailAndPassword(email: string, password: string): Promise<{ user: MockUser }> {
    return this.signInWithEmailAndPassword(email, password);
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mockUser');
    }

    // Notify listeners
    this.notifyListeners(null);
  }

  onAuthStateChanged(callback: (user: MockUser | null) => void): () => void {
    // Add listener
    this.listeners.push(callback);
    
    // Immediately call with current state
    callback(this.currentUser);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private notifyListeners(user: MockUser | null) {
    this.listeners.forEach(listener => listener(user));
  }

  getCurrentUser(): MockUser | null {
    return this.currentUser;
  }

  // Quick login helpers for development
  async signInAsAdmin(): Promise<{ user: MockUser }> {
    return this.signInWithEmailAndPassword('admin@equanimity.local', 'admin123');
  }

  async signInAsUser(): Promise<{ user: MockUser }> {
    return this.signInWithEmailAndPassword('user@equanimity.local', 'user123');
  }

  async signInAsManager(): Promise<{ user: MockUser }> {
    return this.signInWithEmailAndPassword('manager@equanimity.local', 'manager123');
  }
}

// Create singleton instance
export const mockAuth = new MockAuthService();

// Export mock auth functions that match Firebase API
export function getAuth() {
  return {
    currentUser: mockAuth.getCurrentUser(),
  };
}

export function onAuthStateChanged(callback: (user: MockUser | null) => void) {
  return mockAuth.onAuthStateChanged(callback);
}

export async function signInWithEmailAndPassword(email: string, password: string) {
  return mockAuth.signInWithEmailAndPassword(email, password);
}

export async function createUserWithEmailAndPassword(email: string, password: string) {
  return mockAuth.createUserWithEmailAndPassword(email, password);
}

export async function signOut() {
  return mockAuth.signOut();
}

export async function sendEmailVerification(user: MockUser) {
  console.log('[Mock] Email verification sent to:', user.email);
  return Promise.resolve();
}