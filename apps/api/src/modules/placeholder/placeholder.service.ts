import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

export interface PlaceholderItem {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class PlaceholderService {
  private items: Map<string, PlaceholderItem> = new Map();

  constructor() {
    // Seed initial items if needed
    const initialId = 'item-seed-1';
    this.items.set(initialId, {
      id: initialId,
      name: 'Initial Placeholder Item',
      description: 'System seed item for testing',
      category: 'general',
      status: 'active',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  findAll(category?: string): PlaceholderItem[] {
    const all = Array.from(this.items.values());
    if (category) {
      return all.filter((i) => i.category === category);
    }
    return all;
  }

  findById(id: string): PlaceholderItem {
    const item = this.items.get(id);
    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }
    return item;
  }

  create(data: Partial<PlaceholderItem>, user: any): PlaceholderItem {
    const id = data.id || randomUUID();
    const newItem: PlaceholderItem = {
      id,
      name: data.name || `Item ${Date.now()}`,
      description: data.description || '',
      category: data.category || 'default',
      status: data.status || 'active',
      createdBy: user?.userId || user?.email || 'anonymous',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, newItem);
    return newItem;
  }

  update(id: string, data: Partial<PlaceholderItem>): PlaceholderItem {
    const item = this.findById(id);
    const updated: PlaceholderItem = {
      ...item,
      ...data,
      id: item.id, // Immutable ID
      updatedAt: new Date().toISOString(),
    };
    this.items.set(id, updated);
    return updated;
  }

  delete(id: string): { success: boolean; message: string; deletedId: string; remainingCount: number } {
    this.findById(id); // Throws 404 if not found
    this.items.delete(id);
    return {
      success: true,
      message: `Item ${id} successfully deleted`,
      deletedId: id,
      remainingCount: this.items.size,
    };
  }

  reset(): void {
    this.items.clear();
  }
}
