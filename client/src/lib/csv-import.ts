import { InsertAsset, InsertComponent, InsertAccessory, AssetStatus, AccessoryStatus } from "@shared/schema";
// Import VM types as interfaces since they're defined within the VM Inventory page
interface VirtualMachine {
  id: number;
  // VM Identification
  vmId: string;
  vmName: string;
  vmStatus: string;
  vmIp: string;
  internetAccess: boolean;
  vmOs: string;
  vmOsVersion: string;
  // Host Details
  hypervisor: string;
  hostname: string;
  hostModel: string;
  hostIp: string;
  hostOs: string;
  rack: string;
  // Usage and tracking
  deployedBy: string;
  user: string;
  department: string;
  startDate: string;
  endDate: string;
  jiraTicket: string;
  remarks: string;
  dateDeleted: string | null;
}

type NewVirtualMachine = Omit<VirtualMachine, "id">;

export type CSVVM = {
  // VM Identification
  vmId: string;
  vmName: string;
  vmStatus?: string;
  vmIp?: string;
  internetAccess?: string;
  vmOs?: string;
  vmOsVersion?: string;
  // Host Details
  hypervisor: string;
  hostname?: string;
  hostModel?: string;
  hostIp?: string;
  hostOs?: string;
  rack?: string;
  // Usage and tracking
  deployedBy?: string;
  user?: string;
  department?: string;
  startDate?: string;
  endDate?: string;
  jiraTicket?: string;
  remarks?: string;
};

export type CSVAsset = {
  knoxId: string;
  serialNumber: string;
  assetTag?: string;
  ipAddress?: string;
  macAddress?: string;
  osType?: string;
  name?: string;
  category?: string;
};

export type CSVComponent = {
  name: string;
  category: string;
  quantity?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  notes?: string;
};

export type CSVAccessory = {
  name: string;
  category: string;
  status?: string;
  quantity?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  notes?: string;
};

/**
 * Parse a CSV file containing asset data
 * Required fields: knoxId, serialNumber
 * Optional fields: assetTag, ipAddress, macAddress, osType, name, category
 */
export function parseCSV(csvContent: string): CSVAsset[] {
  const lines = csvContent.split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }
  
  // Parse header row
  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  
  // Validate required headers
  const requiredHeaders = ['knoxid', 'serialnumber'];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  
  if (missingHeaders.length > 0) {
    throw new Error(`CSV file is missing required headers: ${missingHeaders.join(', ')}`);
  }
  
  // Parse data rows
  const assets: CSVAsset[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const values = lines[i].split(',').map(value => value.trim());
    
    if (values.length !== headers.length) {
      throw new Error(`Line ${i + 1} has ${values.length} values, but header has ${headers.length} columns`);
    }
    
    const asset: any = {};
    
    headers.forEach((header, index) => {
      // Map CSV headers to asset properties
      switch (header) {
        case 'knoxid':
          asset.knoxId = values[index];
          break;
        case 'serialnumber':
          asset.serialNumber = values[index];
          break;
        case 'assettag':
        case 'asset tag':
        case 'asset_tag':
          asset.assetTag = values[index];
          break;
        case 'ipaddress':
        case 'ip address':
        case 'ip_address':
          asset.ipAddress = values[index];
          break;
        case 'macaddress':
        case 'mac address':
        case 'mac_address':
          asset.macAddress = values[index];
          break;
        case 'ostype':
        case 'os type':
        case 'os_type':
          asset.osType = values[index];
          break;
        case 'name':
          asset.name = values[index];
          break;
        case 'category':
          asset.category = values[index];
          break;
        default:
          // Ignore unknown headers
          break;
      }
    });
    
    // Validate required fields
    if (!asset.knoxId || !asset.serialNumber) {
      throw new Error(`Line ${i + 1} is missing required values`);
    }
    
    assets.push(asset as CSVAsset);
  }
  
  return assets;
}

/**
 * Convert CSV assets to database asset format
 */
export function convertCSVToAssets(csvAssets: CSVAsset[]): InsertAsset[] {
  return csvAssets.map(csvAsset => {
    // Generate asset tag if not provided
    const assetTag = csvAsset.assetTag || 
      `A-${csvAsset.serialNumber.substring(0, 6)}-${Math.floor(Math.random() * 1000)}`;
    
    // Generate name if not provided
    const name = csvAsset.name || `Asset ${assetTag}`;
    
    // Default category
    const category = csvAsset.category || 'Laptop';
    
    return {
      assetTag,
      name,
      category,
      status: AssetStatus.AVAILABLE,
      serialNumber: csvAsset.serialNumber,
      knoxId: csvAsset.knoxId,
      ipAddress: csvAsset.ipAddress || null,
      macAddress: csvAsset.macAddress || null,
      osType: csvAsset.osType || null,
      description: null,
      location: null,
      purchaseDate: null,
      purchaseCost: null,
      model: null,
      manufacturer: null,
      notes: `Imported via CSV. KnoxID: ${csvAsset.knoxId}`,
      financeUpdated: false,
    };
  });
}

/**
 * Parse a CSV file containing component data
 * Required fields: name, category
 * Optional fields: quantity, serialNumber, manufacturer, model, notes
 */
export function parseComponentCSV(csvContent: string): CSVComponent[] {
  const lines = csvContent.split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }
  
  // Parse header row
  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  
  // Validate required headers
  const requiredHeaders = ['name', 'category'];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  
  if (missingHeaders.length > 0) {
    throw new Error(`CSV file is missing required headers: ${missingHeaders.join(', ')}`);
  }
  
  // Parse data rows
  const components: CSVComponent[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const values = lines[i].split(',').map(value => value.trim());
    
    if (values.length !== headers.length) {
      throw new Error(`Line ${i + 1} has ${values.length} values, but header has ${headers.length} columns`);
    }
    
    const component: any = {};
    
    headers.forEach((header, index) => {
      // Map CSV headers to component properties
      switch (header) {
        case 'name':
          component.name = values[index];
          break;
        case 'category':
          component.category = values[index];
          break;
        case 'quantity':
          component.quantity = values[index];
          break;
        case 'serialnumber':
        case 'serial number':
        case 'serial_number':
          component.serialNumber = values[index];
          break;
        case 'manufacturer':
          component.manufacturer = values[index];
          break;
        case 'model':
          component.model = values[index];
          break;
        case 'notes':
          component.notes = values[index];
          break;
        default:
          // Ignore unknown headers
          break;
      }
    });
    
    // Validate required fields
    if (!component.name || !component.category) {
      throw new Error(`Line ${i + 1} is missing required values`);
    }
    
    components.push(component as CSVComponent);
  }
  
  return components;
}

/**
 * Convert CSV components to database component format
 */
export function convertCSVToComponents(csvComponents: CSVComponent[]): InsertComponent[] {
  return csvComponents.map(csvComponent => {
    const quantity = csvComponent.quantity ? parseInt(csvComponent.quantity) : 1;
    
    return {
      name: csvComponent.name,
      category: csvComponent.category,
      description: null,
      purchaseDate: null,
      purchaseCost: null,
      location: null,
      serialNumber: csvComponent.serialNumber || null,
      model: csvComponent.model || null,
      manufacturer: csvComponent.manufacturer || null,
      notes: csvComponent.notes || `Imported via CSV`,
      quantity: quantity,
    };
  });
}

/**
 * Parse a CSV file containing accessory data
 * Required fields: name, category
 * Optional fields: status, quantity, serialNumber, manufacturer, model, notes
 */
export function parseAccessoryCSV(csvContent: string): CSVAccessory[] {
  const lines = csvContent.split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }
  
  // Parse header row
  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  
  // Validate required headers
  const requiredHeaders = ['name', 'category'];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  
  if (missingHeaders.length > 0) {
    throw new Error(`CSV file is missing required headers: ${missingHeaders.join(', ')}`);
  }
  
  // Parse data rows
  const accessories: CSVAccessory[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const values = lines[i].split(',').map(value => value.trim());
    
    if (values.length !== headers.length) {
      throw new Error(`Line ${i + 1} has ${values.length} values, but header has ${headers.length} columns`);
    }
    
    const accessory: any = {};
    
    headers.forEach((header, index) => {
      // Map CSV headers to accessory properties
      switch (header) {
        case 'name':
          accessory.name = values[index];
          break;
        case 'category':
          accessory.category = values[index];
          break;
        case 'status':
          accessory.status = values[index];
          break;
        case 'quantity':
          accessory.quantity = values[index];
          break;
        case 'serialnumber':
        case 'serial number':
        case 'serial_number':
          accessory.serialNumber = values[index];
          break;
        case 'manufacturer':
          accessory.manufacturer = values[index];
          break;
        case 'model':
          accessory.model = values[index];
          break;
        case 'notes':
          accessory.notes = values[index];
          break;
        default:
          // Ignore unknown headers
          break;
      }
    });
    
    // Validate required fields
    if (!accessory.name || !accessory.category) {
      throw new Error(`Line ${i + 1} is missing required values`);
    }
    
    accessories.push(accessory as CSVAccessory);
  }
  
  return accessories;
}

/**
 * Convert CSV accessories to database accessory format
 */
export function convertCSVToAccessories(csvAccessories: CSVAccessory[]): InsertAccessory[] {
  return csvAccessories.map(csvAccessory => {
    const quantity = csvAccessory.quantity ? parseInt(csvAccessory.quantity) : 1;
    
    // Map status string to status enum or default to AVAILABLE
    let status = AccessoryStatus.AVAILABLE;
    if (csvAccessory.status) {
      const statusLower = csvAccessory.status.toLowerCase();
      if (statusLower.includes('borrowed')) {
        status = AccessoryStatus.BORROWED;
      } else if (statusLower.includes('returned')) {
        status = AccessoryStatus.RETURNED;
      } else if (statusLower.includes('defective')) {
        status = AccessoryStatus.DEFECTIVE;
      }
    }
    
    return {
      name: csvAccessory.name,
      category: csvAccessory.category,
      status: status,
      description: null,
      purchaseDate: null,
      purchaseCost: null,
      location: null,
      serialNumber: csvAccessory.serialNumber || null,
      model: csvAccessory.model || null,
      manufacturer: csvAccessory.manufacturer || null,
      notes: csvAccessory.notes || `Imported via CSV`,
      quantity: quantity,
      assignedTo: null,
    };
  });
}

/**
 * Parse a CSV file containing VM data
 * Required fields: vmId, vmName, hypervisor
 * Optional fields: all other VM fields
 */
export function parseVMCSV(csvContent: string): CSVVM[] {
  const lines = csvContent.split('\n');
  
  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row');
  }
  
  // Parse header row
  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  
  // Validate required headers
  const requiredHeaders = ['vmid', 'vmname', 'hypervisor'];
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  
  if (missingHeaders.length > 0) {
    throw new Error(`CSV file is missing required headers: ${missingHeaders.join(', ')}`);
  }
  
  // Parse data rows
  const vms: CSVVM[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const values = lines[i].split(',').map(value => value.trim());
    
    if (values.length !== headers.length) {
      throw new Error(`Line ${i + 1} has ${values.length} values, but header has ${headers.length} columns`);
    }
    
    const vm: any = {};
    
    headers.forEach((header, index) => {
      // Map CSV headers to VM properties
      switch (header) {
        case 'vmid':
          vm.vmId = values[index];
          break;
        case 'vmname':
          vm.vmName = values[index];
          break;
        case 'vmstatus':
          vm.vmStatus = values[index];
          break;
        case 'vmip':
          vm.vmIp = values[index];
          break;
        case 'internetaccess':
        case 'internet_access':
          vm.internetAccess = values[index];
          break;
        case 'vmos':
        case 'vm_os':
          vm.vmOs = values[index];
          break;
        case 'vmosversion':
        case 'vm_os_version':
          vm.vmOsVersion = values[index];
          break;
        case 'hypervisor':
          vm.hypervisor = values[index];
          break;
        case 'hostname':
          vm.hostname = values[index];
          break;
        case 'hostmodel':
        case 'host_model':
          vm.hostModel = values[index];
          break;
        case 'hostip':
        case 'host_ip':
          vm.hostIp = values[index];
          break;
        case 'hostos':
        case 'host_os':
          vm.hostOs = values[index];
          break;
        case 'rack':
          vm.rack = values[index];
          break;
        case 'deployedby':
        case 'deployed_by':
          vm.deployedBy = values[index];
          break;
        case 'user':
          vm.user = values[index];
          break;
        case 'department':
          vm.department = values[index];
          break;
        case 'startdate':
        case 'start_date':
          vm.startDate = values[index];
          break;
        case 'enddate':
        case 'end_date':
          vm.endDate = values[index];
          break;
        case 'jiraticket':
        case 'jira_ticket':
          vm.jiraTicket = values[index];
          break;
        case 'remarks':
        case 'notes':
          vm.remarks = values[index];
          break;
        default:
          // Ignore unknown headers
          break;
      }
    });
    
    // Validate required fields
    if (!vm.vmId || !vm.vmName || !vm.hypervisor) {
      throw new Error(`Line ${i + 1} is missing required values`);
    }
    
    vms.push(vm as CSVVM);
  }
  
  return vms;
}

/**
 * Convert CSV VMs to VM format
 */
export function convertCSVToVMs(csvVMs: CSVVM[]): NewVirtualMachine[] {
  return csvVMs.map(csvVM => {
    // Parse boolean from string
    const internetAccess = typeof csvVM.internetAccess === 'string' 
      ? csvVM.internetAccess.toLowerCase() === 'true' || csvVM.internetAccess.toLowerCase() === 'yes' || csvVM.internetAccess === '1'
      : false;
    
    // Set default VM status if not provided
    const vmStatus = csvVM.vmStatus || 'Provisioning';
    
    // Set today's date as the default start date if not provided
    const startDate = csvVM.startDate || new Date().toISOString().substring(0, 10);
    
    // Set default end date as one year from start date if not provided
    let endDate = csvVM.endDate;
    if (!endDate && startDate) {
      const endDateObj = new Date(startDate);
      endDateObj.setFullYear(endDateObj.getFullYear() + 1);
      endDate = endDateObj.toISOString().substring(0, 10);
    }
    
    return {
      vmId: csvVM.vmId,
      vmName: csvVM.vmName,
      vmStatus: vmStatus,
      vmIp: csvVM.vmIp || "",
      internetAccess,
      vmOs: csvVM.vmOs || "",
      vmOsVersion: csvVM.vmOsVersion || "",
      hypervisor: csvVM.hypervisor,
      hostname: csvVM.hostname || "",
      hostModel: csvVM.hostModel || "",
      hostIp: csvVM.hostIp || "",
      hostOs: csvVM.hostOs || "",
      rack: csvVM.rack || "",
      deployedBy: csvVM.deployedBy || "",
      user: csvVM.user || "",
      department: csvVM.department || "",
      startDate,
      endDate: endDate || "",
      jiraTicket: csvVM.jiraTicket || "",
      remarks: csvVM.remarks || "Imported via CSV",
      dateDeleted: null
    };
  });
}

/**
 * Utility to convert object to CSV
 */
export function convertToCSV(objArray: any[]): string {
  const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
  
  // Get all headers from all objects
  const headers = array.reduce((headers: string[], obj: any) => {
    Object.keys(obj).forEach(key => {
      if (!headers.includes(key)) {
        headers.push(key);
      }
    });
    return headers;
  }, []);
  
  let str = headers.join(',') + '\r\n';
  
  array.forEach((item: any) => {
    let line = '';
    headers.forEach((header, index) => {
      if (line !== '') line += ',';
      
      // Check if the value exists
      const value = item[header] !== undefined ? item[header] : '';
      
      // Handle various types
      if (typeof value === 'string') {
        // Escape commas and quotes in strings
        line += `"${value.replace(/"/g, '""')}"`;
      } else if (value === null) {
        line += '';
      } else {
        line += value;
      }
    });
    str += line + '\r\n';
  });
  
  return str;
}

/**
 * Download CSV data as a file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  // Create a URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Set link properties
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  // Append to the document, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}