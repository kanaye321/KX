import {
  users, assets, components, accessories, licenses, activities, consumables, licenseAssignments,
  type User, type InsertUser, 
  type Asset, type InsertAsset,
  type Activity, type InsertActivity,
  type License, type InsertLicense,
  type Accessory, type InsertAccessory,
  type Component, type InsertComponent,
  type Consumable, type InsertConsumable,
  type LicenseAssignment, type InsertLicenseAssignment,
  AssetStatus, LicenseStatus, AccessoryStatus, ConsumableStatus,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { IStorage, AssetStats } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updateData: Partial<InsertUser>): Promise<User | undefined> {
    // Get the current user if we need to return without updates
    if (Object.keys(updateData).length === 0) {
      return await this.getUser(id);
    }
    
    const [updated] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: number): Promise<boolean> {
    const [deleted] = await db.delete(users)
      .where(eq(users.id, id))
      .returning();
    return !!deleted;
  }

  // Asset operations
  async getAssets(): Promise<Asset[]> {
    return await db.select().from(assets);
  }

  async getAsset(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async getAssetByTag(assetTag: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.assetTag, assetTag));
    return asset;
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db.insert(assets).values(insertAsset).returning();
    return asset;
  }

  async updateAsset(id: number, updateData: Partial<InsertAsset>): Promise<Asset | undefined> {
    const [updated] = await db.update(assets)
      .set(updateData)
      .where(eq(assets.id, id))
      .returning();
    return updated;
  }

  async deleteAsset(id: number): Promise<boolean> {
    const [deleted] = await db.delete(assets)
      .where(eq(assets.id, id))
      .returning();
    return !!deleted;
  }

  // Component operations
  async getComponents(): Promise<Component[]> {
    return await db.select().from(components);
  }

  async getComponent(id: number): Promise<Component | undefined> {
    const [component] = await db.select().from(components).where(eq(components.id, id));
    return component;
  }

  async createComponent(insertComponent: InsertComponent): Promise<Component> {
    const [component] = await db.insert(components).values(insertComponent).returning();
    
    // Create activity record
    await this.createActivity({
      action: "create",
      itemType: "component",
      itemId: component.id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Component "${component.name}" created`,
    });
    
    return component;
  }

  async updateComponent(id: number, updateData: Partial<InsertComponent>): Promise<Component | undefined> {
    const [component] = await db.select().from(components).where(eq(components.id, id));
    if (!component) return undefined;
    
    const [updated] = await db.update(components)
      .set(updateData)
      .where(eq(components.id, id))
      .returning();
    
    if (updated) {
      // Create activity record
      await this.createActivity({
        action: "update",
        itemType: "component",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Component "${component.name}" updated`,
      });
    }
    
    return updated;
  }

  async deleteComponent(id: number): Promise<boolean> {
    const [component] = await db.select().from(components).where(eq(components.id, id));
    if (!component) return false;
    
    const [deleted] = await db.delete(components)
      .where(eq(components.id, id))
      .returning();
    
    if (deleted) {
      // Create activity record
      await this.createActivity({
        action: "delete",
        itemType: "component",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Component "${component.name}" deleted`,
      });
    }
    
    return !!deleted;
  }

  // Accessory operations
  async getAccessories(): Promise<Accessory[]> {
    return await db.select().from(accessories);
  }

  async getAccessory(id: number): Promise<Accessory | undefined> {
    const [accessory] = await db.select().from(accessories).where(eq(accessories.id, id));
    return accessory;
  }

  async createAccessory(insertAccessory: InsertAccessory): Promise<Accessory> {
    // Make sure quantity is a number
    const processedAccessory = {
      ...insertAccessory,
      quantity: typeof insertAccessory.quantity === 'string' 
        ? parseInt(insertAccessory.quantity) 
        : insertAccessory.quantity
    };
    
    const [accessory] = await db.insert(accessories).values(processedAccessory).returning();
    
    // Create activity record
    await this.createActivity({
      action: "create",
      itemType: "accessory",
      itemId: accessory.id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Accessory "${accessory.name}" created`,
    });
    
    return accessory;
  }

  async updateAccessory(id: number, updateData: Partial<InsertAccessory>): Promise<Accessory | undefined> {
    const [accessory] = await db.select().from(accessories).where(eq(accessories.id, id));
    if (!accessory) return undefined;
    
    // Convert quantity from string to number if needed
    if (typeof updateData.quantity === 'string') {
      updateData.quantity = parseInt(updateData.quantity);
    }
    
    const [updated] = await db.update(accessories)
      .set(updateData)
      .where(eq(accessories.id, id))
      .returning();
    
    if (updated) {
      // Create activity record
      await this.createActivity({
        action: "update",
        itemType: "accessory",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Accessory "${accessory.name}" updated`,
      });
    }
    
    return updated;
  }

  async deleteAccessory(id: number): Promise<boolean> {
    const [accessory] = await db.select().from(accessories).where(eq(accessories.id, id));
    if (!accessory) return false;
    
    const [deleted] = await db.delete(accessories)
      .where(eq(accessories.id, id))
      .returning();
    
    if (deleted) {
      // Create activity record
      await this.createActivity({
        action: "delete",
        itemType: "accessory",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Accessory "${accessory.name}" deleted`,
      });
    }
    
    return !!deleted;
  }

  // Consumable operations
  async getConsumables(): Promise<Consumable[]> {
    return await db.select().from(consumables);
  }

  async getConsumable(id: number): Promise<Consumable | undefined> {
    const [consumable] = await db.select().from(consumables).where(eq(consumables.id, id));
    return consumable;
  }

  async createConsumable(insertConsumable: InsertConsumable): Promise<Consumable> {
    // Make sure quantity is a number
    const processedConsumable = {
      ...insertConsumable,
      quantity: typeof insertConsumable.quantity === 'string' 
        ? parseInt(insertConsumable.quantity) 
        : insertConsumable.quantity
    };
    
    const [consumable] = await db.insert(consumables).values(processedConsumable).returning();
    
    // Create activity record
    await this.createActivity({
      action: "create",
      itemType: "consumable",
      itemId: consumable.id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `Consumable "${consumable.name}" created`,
    });
    
    return consumable;
  }

  async updateConsumable(id: number, updateData: Partial<InsertConsumable>): Promise<Consumable | undefined> {
    const [consumable] = await db.select().from(consumables).where(eq(consumables.id, id));
    if (!consumable) return undefined;
    
    // Convert quantity from string to number if needed
    if (typeof updateData.quantity === 'string') {
      updateData.quantity = parseInt(updateData.quantity);
    }
    
    const [updated] = await db.update(consumables)
      .set(updateData)
      .where(eq(consumables.id, id))
      .returning();
    
    if (updated) {
      // Create activity record
      await this.createActivity({
        action: "update",
        itemType: "consumable",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Consumable "${consumable.name}" updated`,
      });
    }
    
    return updated;
  }

  async deleteConsumable(id: number): Promise<boolean> {
    const [consumable] = await db.select().from(consumables).where(eq(consumables.id, id));
    if (!consumable) return false;
    
    const [deleted] = await db.delete(consumables)
      .where(eq(consumables.id, id))
      .returning();
    
    if (deleted) {
      // Create activity record
      await this.createActivity({
        action: "delete",
        itemType: "consumable",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `Consumable "${consumable.name}" deleted`,
      });
    }
    
    return !!deleted;
  }

  // License operations
  async getLicenses(): Promise<License[]> {
    return await db.select().from(licenses);
  }

  async getLicense(id: number): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    return license;
  }

  async createLicense(insertLicense: InsertLicense): Promise<License> {
    const [license] = await db.insert(licenses).values(insertLicense).returning();
    
    // Create activity record
    await this.createActivity({
      action: "create",
      itemType: "license",
      itemId: license.id,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `License "${license.name}" created`,
    });
    
    return license;
  }

  async updateLicense(id: number, updateData: Partial<InsertLicense>): Promise<License | undefined> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    if (!license) return undefined;
    
    const [updated] = await db.update(licenses)
      .set(updateData)
      .where(eq(licenses.id, id))
      .returning();
    
    if (updated) {
      // Create activity record
      await this.createActivity({
        action: "update",
        itemType: "license",
        itemId: id,
        userId: null,
        timestamp: new Date().toISOString(),
        notes: `License "${license.name}" updated`,
      });
    }
    
    return updated;
  }

  async deleteLicense(id: number): Promise<boolean> {
    const [license] = await db.select().from(licenses).where(eq(licenses.id, id));
    if (!license) return false;
    
    try {
      // First delete all license assignments related to this license
      await db.delete(licenseAssignments)
        .where(eq(licenseAssignments.licenseId, id));
      
      // Then delete the license
      const [deleted] = await db.delete(licenses)
        .where(eq(licenses.id, id))
        .returning();
      
      if (deleted) {
        // Create activity record
        await this.createActivity({
          action: "delete",
          itemType: "license",
          itemId: id,
          userId: null,
          timestamp: new Date().toISOString(),
          notes: `License "${license.name}" deleted`,
        });
      }
      
      return !!deleted;
    } catch (error) {
      console.error("Error deleting license:", error);
      throw error;
    }
  }
  
  // License assignment operations
  async getLicenseAssignments(licenseId: number): Promise<LicenseAssignment[]> {
    return await db.select()
      .from(licenseAssignments)
      .where(eq(licenseAssignments.licenseId, licenseId))
      .orderBy(licenseAssignments.assignedDate);
  }
  
  async createLicenseAssignment(insertAssignment: InsertLicenseAssignment): Promise<LicenseAssignment> {
    const [assignment] = await db
      .insert(licenseAssignments)
      .values(insertAssignment)
      .returning();
    
    // Create activity record
    await this.createActivity({
      action: "update",
      itemType: "license",
      itemId: insertAssignment.licenseId,
      userId: null,
      timestamp: new Date().toISOString(),
      notes: `License seat assigned to: ${insertAssignment.assignedTo}`,
    });
    
    return assignment;
  }

  // Checkout/checkin operations
  async checkoutAsset(assetId: number, userId: number, expectedCheckinDate?: string, customNotes?: string): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    
    if (!asset || !user) return undefined;
    if (asset.status !== AssetStatus.AVAILABLE) return undefined;
    
    const today = new Date().toISOString().split("T")[0];
    
    const [updatedAsset] = await db.update(assets)
      .set({
        status: AssetStatus.DEPLOYED,
        assignedTo: userId,
        checkoutDate: today,
        expectedCheckinDate: expectedCheckinDate || null,
      })
      .where(eq(assets.id, assetId))
      .returning();
    
    if (updatedAsset) {
      // Create activity record
      await this.createActivity({
        action: "checkout",
        itemType: "asset",
        itemId: assetId,
        userId,
        timestamp: new Date().toISOString(),
        notes: customNotes || `Asset ${asset.name} (${asset.assetTag}) checked out to ${user.firstName} ${user.lastName}`,
      });
    }
    
    return updatedAsset;
  }

  async checkinAsset(assetId: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));
    
    if (!asset) return undefined;
    if (asset.status !== AssetStatus.DEPLOYED && asset.status !== AssetStatus.OVERDUE) return undefined;
    
    const [updatedAsset] = await db.update(assets)
      .set({
        status: AssetStatus.AVAILABLE,
        assignedTo: null,
        checkoutDate: null,
        expectedCheckinDate: null,
        knoxId: null, // Clear the Knox ID when checking in
      })
      .where(eq(assets.id, assetId))
      .returning();
    
    if (updatedAsset) {
      // Create activity record
      await this.createActivity({
        action: "checkin",
        itemType: "asset",
        itemId: assetId,
        userId: asset.assignedTo,
        timestamp: new Date().toISOString(),
        notes: `Asset ${asset.name} (${asset.assetTag}) checked in`,
      });
    }
    
    return updatedAsset;
  }

  // Activity operations
  async getActivities(): Promise<Activity[]> {
    // Order by timestamp descending for newest first
    return await db.select()
      .from(activities)
      .orderBy(activities.timestamp);
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(activities.timestamp);
  }

  async getActivitiesByAsset(assetId: number): Promise<Activity[]> {
    return await db.select()
      .from(activities)
      .where(eq(activities.itemId, assetId))
      .orderBy(activities.timestamp);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db.insert(activities).values(insertActivity).returning();
    return activity;
  }

  // Stats and summaries
  async getAssetStats(): Promise<AssetStats> {
    const allAssets = await db.select().from(assets);
    
    return {
      total: allAssets.length,
      checkedOut: allAssets.filter(asset => asset.status === AssetStatus.DEPLOYED).length,
      available: allAssets.filter(asset => asset.status === AssetStatus.AVAILABLE).length,
      pending: allAssets.filter(asset => asset.status === AssetStatus.PENDING).length,
      overdue: allAssets.filter(asset => asset.status === AssetStatus.OVERDUE).length,
      archived: allAssets.filter(asset => asset.status === AssetStatus.ARCHIVED).length,
    };
  }

  // Zabbix settings operations (stub implementations for now)
  async getZabbixSettings(): Promise<any> {
    return undefined;
  }

  async saveZabbixSettings(settings: any): Promise<any> {
    return settings;
  }

  // Zabbix subnet operations (stub implementations)
  async getZabbixSubnets(): Promise<any[]> {
    return [];
  }

  async getZabbixSubnet(id: number): Promise<any> {
    return undefined;
  }

  async createZabbixSubnet(subnet: any): Promise<any> {
    return subnet;
  }

  async deleteZabbixSubnet(id: number): Promise<boolean> {
    return true;
  }

  // VM monitoring operations (stub implementations)
  async getVMMonitoring(): Promise<any[]> {
    return [];
  }

  async getVMMonitoringByVMId(vmId: number): Promise<any> {
    return undefined;
  }

  async createVMMonitoring(monitoring: any): Promise<any> {
    return monitoring;
  }

  async updateVMMonitoring(id: number, monitoring: any): Promise<any> {
    return monitoring;
  }

  // Discovered hosts operations (stub implementations)
  async getDiscoveredHosts(): Promise<any[]> {
    return [];
  }

  async getDiscoveredHost(id: number): Promise<any> {
    return undefined;
  }

  async createDiscoveredHost(host: any): Promise<any> {
    return host;
  }

  async updateDiscoveredHost(id: number, host: any): Promise<any> {
    return host;
  }

  async deleteDiscoveredHost(id: number): Promise<boolean> {
    return true;
  }

  // BitLocker keys operations (stub implementations)
  async getBitlockerKeys(): Promise<any[]> {
    return [];
  }

  async getBitlockerKey(id: number): Promise<any> {
    return undefined;
  }

  async getBitlockerKeyBySerialNumber(serialNumber: string): Promise<any[]> {
    return [];
  }

  async getBitlockerKeyByIdentifier(identifier: string): Promise<any[]> {
    return [];
  }

  async createBitlockerKey(key: any): Promise<any> {
    return key;
  }

  async updateBitlockerKey(id: number, key: any): Promise<any> {
    return key;
  }

  async deleteBitlockerKey(id: number): Promise<boolean> {
    return true;
  }

  // VM Inventory operations (stub implementations)
  async getVmInventory(): Promise<any[]> {
    return [];
  }

  async getVmInventoryItem(id: number): Promise<any> {
    return undefined;
  }

  async createVmInventoryItem(vm: any): Promise<any> {
    return vm;
  }

  async updateVmInventoryItem(id: number, vm: any): Promise<any> {
    return vm;
  }

  async deleteVmInventoryItem(id: number): Promise<boolean> {
    return true;
  }
}