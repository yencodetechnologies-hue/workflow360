import { Navigate } from 'react-router-dom'
import { useGodownScope } from '../hooks/useGodownScope'
import { ProductsListPage } from './Products/List'

export function ProductsGodownRedirect() {
  const { isGodown, godownBasePath } = useGodownScope()

  if (isGodown && godownBasePath) {
    return <Navigate to={`${godownBasePath}?tab=catalog`} replace />
  }

  return <ProductsListPage />
}
