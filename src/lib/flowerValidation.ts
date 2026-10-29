import type { Flower } from '@/types/hoaKhangThanh';

/**
 * Phân tách chuỗi tên riêng thành mảng các tên riêng (cách nhau bởi dấu phẩy ,)
 * Tự động chuẩn hóa khoảng trắng và loại bỏ các tên rỗng hoặc trùng lặp (không phân biệt hoa thường)
 */
export function parseAliases(customName?: string): string[] {
  if (!customName || typeof customName !== 'string') return [];
  const rawList = customName.split(',').map((s) => s.trim()).filter(Boolean);
  const seen = new Set<string>();
  const uniqueList: string[] = [];

  for (const item of rawList) {
    const lower = item.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueList.push(item);
    }
  }

  return uniqueList;
}

/**
 * Nối mảng tên riêng thành chuỗi chuẩn phân cách bởi dấu phẩy và khoảng trắng (, )
 */
export function formatAliases(aliases: string[]): string {
  return aliases.join(', ');
}

/**
 * Kiểm tra tên hoa:
 * - Không được để trống
 * - Không được trùng với tên hoa của giống hoa khác (kể cả chữ hoa chữ thường)
 * - Không được trùng với bất kỳ tên riêng nào của giống hoa khác (kể cả chữ hoa chữ thường)
 */
export function validateFlowerName(
  name: string,
  currentFlowerId: string | undefined,
  allFlowers: Flower[]
): { isValid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Vui lòng nhập tên hoa tươi.' };
  }

  const lowerName = trimmed.toLowerCase();

  for (const other of allFlowers) {
    if (other.id === currentFlowerId) continue;

    // 1. Kiểm tra trùng tên hoa với hoa khác
    if (other.name.trim().toLowerCase() === lowerName) {
      return {
        isValid: false,
        error: `Tên hoa "${trimmed}" đã tồn tại trong danh mục (trùng với giống hoa "${other.name}", không phân biệt chữ hoa chữ thường)!`,
      };
    }

    // 2. Kiểm tra trùng với bất kỳ tên riêng nào của hoa khác
    const otherAliases = parseAliases(other.customName);
    for (const alias of otherAliases) {
      if (alias.toLowerCase() === lowerName) {
        return {
          isValid: false,
          error: `Tên hoa "${trimmed}" bị trùng với tên riêng của giống hoa "${other.name}"!`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Kiểm tra danh sách tên riêng:
 * - Tách các tên riêng qua dấu phẩy (,)
 * - Tự động loại bỏ trùng lặp nội bộ trong cùng 1 hoa
 * - Không được trùng với tên hoa chính thức
 * - Không được trùng với bất kỳ tên hoa hoặc tên riêng nào của các giống hoa khác (kể cả chữ hoa chữ thường)
 */
export function validateFlowerAliases(
  rawCustomName: string,
  currentFlowerId: string | undefined,
  allFlowers: Flower[],
  flowerName?: string
): { isValid: boolean; error?: string; cleanedCustomName: string; aliases: string[] } {
  if (!rawCustomName || !rawCustomName.trim()) {
    return { isValid: true, cleanedCustomName: '', aliases: [] };
  }

  const aliases = parseAliases(rawCustomName);
  const currentFlowerNameLower = flowerName ? flowerName.trim().toLowerCase() : '';

  for (const alias of aliases) {
    const aliasLower = alias.toLowerCase();

    // 1. Không trùng với tên chính của hoa hiện tại
    if (currentFlowerNameLower && aliasLower === currentFlowerNameLower) {
      return {
        isValid: false,
        error: `Tên riêng "${alias}" không được trùng với chính tên hoa "${flowerName?.trim()}"!`,
        cleanedCustomName: formatAliases(aliases),
        aliases,
      };
    }

    // 2. So sánh với tất cả các hoa khác trong hệ thống
    for (const other of allFlowers) {
      if (other.id === currentFlowerId) continue;

      // Trùng với tên hoa của hoa khác
      if (other.name.trim().toLowerCase() === aliasLower) {
        return {
          isValid: false,
          error: `Tên riêng "${alias}" bị trùng với tên giống hoa "${other.name}"! Không được đặt trùng tên.`,
          cleanedCustomName: formatAliases(aliases),
          aliases,
        };
      }

      // Trùng với tên riêng của hoa khác
      const otherAliases = parseAliases(other.customName);
      for (const otherAlias of otherAliases) {
        if (otherAlias.toLowerCase() === aliasLower) {
          return {
            isValid: false,
            error: `Tên riêng "${alias}" đã được đặt cho giống hoa "${other.name}"! Tên riêng không được trùng nhau (kể cả chữ hoa chữ thường).`,
            cleanedCustomName: formatAliases(aliases),
            aliases,
          };
        }
      }
    }
  }

  return {
    isValid: true,
    cleanedCustomName: formatAliases(aliases),
    aliases,
  };
}
