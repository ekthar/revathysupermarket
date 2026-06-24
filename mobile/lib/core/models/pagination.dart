/// Parameters for paginated API requests.
class PaginationParams {
  const PaginationParams({
    this.page = 1,
    this.pageSize = 20,
  });

  final int page;
  final int pageSize;

  Map<String, dynamic> toQueryParameters() => {
        'page': page.toString(),
        'pageSize': pageSize.toString(),
      };

  PaginationParams nextPage() => PaginationParams(
        page: page + 1,
        pageSize: pageSize,
      );

  PaginationParams previousPage() => PaginationParams(
        page: page > 1 ? page - 1 : 1,
        pageSize: pageSize,
      );
}
