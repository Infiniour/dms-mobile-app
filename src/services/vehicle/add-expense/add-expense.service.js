import { api } from '../../http';
import { addExpenseEndpoint } from './add-expense.api';

export function addVehicleExpense({ vehicleId, type, amount, paidTo, description, date }) {
  const endpoint = addExpenseEndpoint.replace(':id', String(vehicleId));

  return api.post(endpoint, {
    type,
    amount,
    paid_to: paidTo,
    description,
    date,
  });
}
