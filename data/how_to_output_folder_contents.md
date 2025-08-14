```sh
find /path/to/folder -type f | while read file; do
    echo "--===== $file =====" >> output.sql
    cat "$file" >> output.sql
    echo >> output.sql
done

```

Example

```sh
find telecom_network_db -type f | while read file; do
    echo "--===== $file =====" >> output.sql
    cat "$file" >> output.sql
    echo >> output.sql
done
```