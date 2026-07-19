import { applyDecorators } from '@nestjs/common';
import { IsEnum, ValidationArguments } from 'class-validator';

/**
 * Same as class-validator's `@IsEnum`, but replaces the default message
 * (which lists the enum's raw numeric values, e.g. "status must be one of
 * the following values: 0, 1, 2, 3") with a plain "Invalid <field>" message
 * — the raw numeric codes are internal implementation detail and shouldn't
 * reach the client.
 */
export function IsEnumValue(enumObj: Record<string, string | number>) {
  return applyDecorators(
    IsEnum(enumObj, {
      message: (args: ValidationArguments) => `Invalid ${args.property}`,
    }),
  );
}
