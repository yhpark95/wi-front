  <div className="flex-1 overflow-auto p-4">
    <div className="space-y-2">
      <PriceLineChart 
        data={filteredData}
        filters={filters}
        onFilterChange={handleFilterChange}
        uniqueProducts={uniqueProducts}
        uniqueImporters={uniqueImporters}
        uniqueDestinations={uniqueDestinations}
        uniqueYears={uniqueYears}
      />
      <QuantityBarChart 
        data={filteredData}
        filters={filters}
      />
    </div>
  </div> 