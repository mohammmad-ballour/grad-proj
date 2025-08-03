package com.grad.social.common.database.utils;

import org.jooq.*;
import org.jooq.impl.DSL;

import java.util.Map;

import static org.jooq.impl.DSL.one;

public class JooqUtils {

	public static <R extends org.jooq.Record> int update(DSLContext dsl, Table<R> table,
			Map<TableField<R, ?>, Object> fieldsToUpdate, Condition searchCondition) {
		checkTypeSafety(fieldsToUpdate);
		return dsl.update(table).set(fieldsToUpdate).where(searchCondition).execute();
	}

	public static <R extends org.jooq.Record> boolean existsBy(DSLContext dsl, Table<R> table, Condition condition) {
		// TODO: may be optimized
		return dsl.selectDistinct(one())
			.from(table)
			.where(DSL.exists(dsl.selectOne().from(table).where(condition)))
			.fetchOne() != null;
	}

	public static <R extends org.jooq.Record> int delete(DSLContext dsl, Table<R> table, Condition condition) {
		return dsl.deleteFrom(table).where(condition).execute();
	}

	private static <R extends org.jooq.Record> void checkTypeSafety(Map<TableField<R, ?>, Object> fieldsToUpdate) {
		for (var field : fieldsToUpdate.entrySet()) {
			TableField<R, ?> key = field.getKey();
			Object value = field.getValue();
			if (!key.getType().equals(value.getClass())) {
				throw new IllegalArgumentException("Value type " + value.getClass().getName()
						+ " does not match the field type " + key.getType().getName());
			}
		}
	}

}
